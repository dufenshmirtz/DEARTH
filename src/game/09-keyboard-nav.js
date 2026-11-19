/* ---------- Keyboard navigation in the menus (desktop app only) ----------
   Like a console game: the arrow keys (or WASD) move a selection between the buttons of the screen on top
   (the nearest row first; left / right stay in the row and wrap round), Enter presses the selected button
   (with nothing selected, the screen's next step: data-nav-enter) and Esc goes back (data-nav-back).
   The selected button gets the class nav-hover; every :hover rule in the stylesheets is copied at start-up
   to also match .nav-hover (installNavHoverStyles), so it looks exactly like mouse hover, and it gets
   mouseenter / pointerenter so tooltips and the Collection's info box open. Moving the mouse hands control
   back to it. A selected Settings slider moves with left / right; Enter ticks a checkbox.
   A new screen starts on data-nav-start, else on its next step (data-nav-enter), else on its first button.
   A question box marked data-nav-modal (Load Run's "Remove this run?") holds the keys until it is answered:
   only its buttons can be selected, and once it closes the selection goes to its data-nav-return selector
   (the run's X), or to the screen's start when that is gone (the run was removed).
   Only the top layer counts: Jesus' Gifts, then the Collection, then an open overlay card (Pause, the death
   card), then the menu. The run's table itself (no card open) is left alone.
   Screens with their own keys (the story and Satan's scenes, Pause's Esc, the Collection's and the Gifts'
   Esc, the Codex's left / right, the table's Enter) take the key first and mark it handled. Alt+Enter is
   the desktop app's fullscreen. A higher data-nav-enter / data-nav-back value wins (a Yes / No question).
   On only in the desktop app (window.dearthDesktop); to try it in a browser set
   localStorage.dearthMenuKeysV1 = "1" and reload. */
const NAV_HOVER_CLASS = "nav-hover";
const MENU_KEYS_DEV_STORAGE_KEY = "dearthMenuKeysV1";
const MENU_NAV_TYPING =
  "textarea, select, [contenteditable='true'], input:not([type='range']):not([type='checkbox']):not([type='radio']):not([type='button'])";
const MENU_NAV_ITEMS = "button:not(:disabled), input[type='range']:not(:disabled), input[type='checkbox']:not(:disabled)";
const MENU_NAV_KEYS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0]
};
const menuNav = { active: false, el: null, key: "", frame: 0, modal: null, returnTo: "" };

function menuKeysEnabled() {
  if (desktopApp()) return true;
  try {
    return window.localStorage?.getItem(MENU_KEYS_DEV_STORAGE_KEY) === "1";
  } catch (error) {
    return false;
  }
}

function menuNavLayer() {
  if (typeof giftsOpen === "function" && giftsOpen()) return document.querySelector(".gifts-screen");
  if (typeof collectionOpen === "function" && collectionOpen()) return document.querySelector(".collection-screen");
  const overlays = [...document.querySelectorAll(".overlay.visible")].filter((el) => el.getClientRects().length);
  const base = overlays[overlays.length - 1] || document;
  // a question box on this layer holds the keys until it is answered
  const modals = [...base.querySelectorAll("[data-nav-modal]")].filter((el) => el.getClientRects().length);
  return modals[modals.length - 1] || base;
}

// notices a question box opening or closing; on closing returns where the selection should go back to
function menuNavTrackModal(layer) {
  const isModal = layer !== document && layer?.hasAttribute?.("data-nav-modal");
  if (isModal) {
    if (menuNav.modal !== layer) {
      menuNav.modal = layer;
      menuNav.returnTo = layer.getAttribute("data-nav-return") || "";
    }
    return null;
  }
  if (!menuNav.modal) return null;
  const selector = menuNav.returnTo;
  menuNav.modal = null;
  menuNav.returnTo = "";
  if (!selector || !layer) return null;
  let back = null;
  try {
    back = layer.querySelector(selector);
  } catch (error) {
    back = null;
  }
  return back && menuNavVisible(back) && back.matches(MENU_NAV_ITEMS) ? back : null;
}

// the run's table (no card open) and the PvP screens keep their own controls
function menuNavAllowed(layer) {
  if (!layer || introCapturesInput()) return false;
  if (typeof giftOpening !== "undefined" && giftOpening) return false;
  return layer !== document || state.mode === "menu";
}

function menuNavVisible(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return false;
  return getComputedStyle(el).visibility !== "hidden";
}

function menuNavItems(layer) {
  return [...layer.querySelectorAll(MENU_NAV_ITEMS)].filter((el) => !el.closest(".floating-tooltip") && menuNavVisible(el));
}

function menuNavTarget(kind, layer) {
  if (!layer) return null;
  const attr = `data-nav-${kind}`;
  let best = null;
  let bestRank = -Infinity;
  layer.querySelectorAll(`[${attr}]`).forEach((el) => {
    if (el.disabled || !el.getClientRects().length) return;
    const rank = Number(el.getAttribute(attr)) || 0;
    if (rank >= bestRank) {
      best = el;
      bestRank = rank;
    }
  });
  return best;
}

// how a button is found again after the screen is redrawn
function menuNavKey(el) {
  if (el.id) return `#${el.id}`;
  const data = [...el.attributes]
    .filter((attr) => attr.name.startsWith("data-") && !attr.name.startsWith("data-nav") && !attr.name.startsWith("data-tooltip"))
    .map((attr) => `${attr.name}=${attr.value}`)
    .join("|");
  return `${el.tagName}|${data}|${el.textContent.trim().slice(0, 40)}`;
}

// synthetic hover, so JS hover effects (tooltips, the Collection's info box) follow the selection
function menuNavPointer(el, phase) {
  const rect = el.getBoundingClientRect();
  const init = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, pointerType: "mouse", view: window };
  const types = phase === "enter" ? ["pointerover", "pointerenter", "mouseover", "mouseenter"] : ["pointerout", "pointerleave", "mouseout", "mouseleave"];
  types.forEach((type) => {
    const bubbles = type.endsWith("over") || type.endsWith("out");
    const Ctor = type.startsWith("pointer") && typeof PointerEvent === "function" ? PointerEvent : MouseEvent;
    try {
      el.dispatchEvent(new Ctor(type, { ...init, bubbles }));
    } catch (error) {
      // no event constructor: the CSS hover still shows
    }
  });
}

function menuNavClear(deactivate = true) {
  const el = menuNav.el;
  menuNav.el = null;
  if (el) {
    el.classList.remove(NAV_HOVER_CLASS);
    if (el.isConnected) menuNavPointer(el, "leave");
  }
  if (deactivate) {
    menuNav.active = false;
    menuNav.key = "";
    menuNav.modal = null;
    menuNav.returnTo = "";
  }
}

function menuNavSelect(el) {
  if (!el) return;
  menuNav.active = true;
  if (menuNav.el === el) {
    el.classList.add(NAV_HOVER_CLASS);
    return;
  }
  menuNavClear(false);
  menuNav.el = el;
  menuNav.key = menuNavKey(el);
  el.classList.add(NAV_HOVER_CLASS);
  el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  menuNavPointer(el, "enter");
}

function menuNavDefault(layer, items) {
  const start = items.find((el) => el.hasAttribute("data-nav-start"));
  if (start) return start;
  const preferred = menuNavTarget("enter", layer);
  return preferred && items.includes(preferred) ? preferred : items[0];
}

function menuNavCenter(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// the nearest row (or column) that way, then the button in it closest in line;
// left / right never leave the row; at an edge the selection wraps to the far end of its row / column
function menuNavMove(dx, dy, layer) {
  const items = menuNavItems(layer);
  if (!items.length) return;
  const current = menuNav.el && items.includes(menuNav.el) ? menuNav.el : null;
  if (!current) {
    menuNavSelect(menuNavDefault(layer, items));
    return;
  }
  const fromRect = current.getBoundingClientRect();
  const from = menuNavCenter(fromRect);
  const ahead = [];
  let wrap = null;
  let wrapScore = Infinity;
  items.forEach((el) => {
    if (el === current) return;
    const rect = el.getBoundingClientRect();
    const to = menuNavCenter(rect);
    const along = (to.x - from.x) * dx + (to.y - from.y) * dy;
    const across = Math.abs((to.x - from.x) * dy) + Math.abs((to.y - from.y) * dx);
    const inLine = dx
      ? rect.top < fromRect.bottom && rect.bottom > fromRect.top
      : rect.left < fromRect.right && rect.right > fromRect.left;
    if (along > 1) {
      // the gap between the two buttons that way (0 when they overlap)
      const gap = Math.max(0, dx > 0 ? rect.left - fromRect.right : dx < 0 ? fromRect.left - rect.right : dy > 0 ? rect.top - fromRect.bottom : fromRect.top - rect.bottom);
      ahead.push({ el, gap, across, inLine });
      return;
    }
    if (along < -1 && inLine) {
      const score = along + across * 2;
      if (score < wrapScore) {
        wrap = el;
        wrapScore = score;
      }
    }
  });
  const pool = dx ? ahead.filter((entry) => entry.inLine) : ahead;
  let best = null;
  if (pool.length) {
    const nearest = Math.min(...pool.map((entry) => entry.gap));
    best = pool.filter((entry) => entry.gap <= nearest + 8).sort((a, b) => a.across - b.across)[0].el;
  }
  menuNavSelect(best || wrap || current);
}

function menuNavStepRange(input, step) {
  const min = input.min === "" ? 0 : Number(input.min);
  const max = input.max === "" ? 100 : Number(input.max);
  const size = Number(input.step) || 1;
  const stride = size === 1 && max - min >= 50 ? 5 : size;
  const value = clamp(Number(input.value) + step * stride, min, max);
  if (value === Number(input.value)) return;
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function menuNavDirection(event) {
  const key = event.key && event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return MENU_NAV_KEYS[key] || null;
}

// after anything redraws: keep the selection on the same button, or put it on the new screen's start
function menuNavRefresh() {
  menuNav.frame = 0;
  if (!menuNav.active) return;
  const layer = menuNavLayer();
  if (!menuNavAllowed(layer)) {
    if (menuNav.el) menuNavClear(false);
    return;
  }
  const back = menuNavTrackModal(layer);
  if (back) {
    menuNavSelect(back);
    return;
  }
  const el = menuNav.el;
  if (el && el.isConnected && layer.contains(el) && menuNavVisible(el)) {
    if (!el.classList.contains(NAV_HOVER_CLASS)) el.classList.add(NAV_HOVER_CLASS);
    return;
  }
  const items = menuNavItems(layer);
  if (!items.length) {
    if (el) menuNavClear(false);
    return;
  }
  const key = menuNav.key;
  if (el) menuNavClear(false);
  menuNavSelect(items.find((item) => menuNavKey(item) === key) || menuNavDefault(layer, items));
}

function menuNavScheduleRefresh() {
  if (!menuNav.active || menuNav.frame) return;
  menuNav.frame = requestAnimationFrame(menuNavRefresh);
}

// every :hover rule gets a twin for .nav-hover; a ":not(:hover)" rule also stops matching the selection
function installNavHoverStyles() {
  [...document.styleSheets].forEach((sheet) => {
    let rules = null;
    try {
      rules = sheet.cssRules;
    } catch (error) {
      return; // a stylesheet the page may not read (index.html opened as a file in Chrome)
    }
    if (rules) navHoverCopyRules(rules, sheet);
  });
}

function navHoverCopyRules(rules, parent) {
  const notHover = ":not(:hover)";
  const notEither = `:not(:hover):not(.${NAV_HOVER_CLASS})`;
  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    if (!rule.selectorText) {
      if (rule.cssRules && typeof rule.insertRule === "function") navHoverCopyRules(rule.cssRules, rule);
      continue;
    }
    let selector = rule.selectorText;
    if (!selector.includes(":hover") || selector.includes(NAV_HOVER_CLASS)) continue;
    if (selector.includes(notHover)) {
      selector = selector.split(notHover).join(notEither);
      try {
        rule.selectorText = selector;
      } catch (error) {
        // leave it as it was
      }
    }
    const marked = selector.split(notEither).join("\u0000");
    if (!marked.includes(":hover")) continue;
    const twin = marked.split(":hover").join(`.${NAV_HOVER_CLASS}`).split("\u0000").join(notEither);
    try {
      parent.insertRule(`${twin} { ${rule.style.cssText} }`, index + 1);
      index += 1;
    } catch (error) {
      // a selector that cannot take a class (a scrollbar part): mouse only
    }
  }
}

function installMenuKeyNavigation() {
  if (!menuKeysEnabled()) return;
  installNavHoverStyles();
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = menuNavDirection(event);
    if (!direction && event.key !== "Enter" && event.key !== "Escape") return;
    if (introCapturesInput()) return;
    const layer = menuNavLayer();
    if (!layer) return;
    // typing in a field of this layer is typing (the guess box under an open Pause card is not)
    const field = event.target?.closest?.(MENU_NAV_TYPING);
    if (field && (layer === document || layer.contains(field))) return;
    if (direction) {
      if (!menuNavAllowed(layer)) return;
      event.preventDefault();
      const back = menuNavTrackModal(layer);
      if (back) {
        menuNavSelect(back);
        return;
      }
      const selected = menuNav.el;
      if (selected?.isConnected && layer.contains(selected) && selected.matches("input[type='range']") && !direction[1]) {
        menuNavStepRange(selected, direction[0]);
        return;
      }
      menuNavMove(direction[0], direction[1], layer);
      return;
    }
    let target = null;
    const selected = menuNav.el;
    if (event.key === "Enter" && selected?.isConnected && layer.contains(selected) && selected.matches("button, input[type='checkbox']")) target = selected;
    if (!target) target = menuNavTarget(event.key === "Enter" ? "enter" : "back", layer);
    if (!target) return;
    // also stops Enter from clicking whichever button the mouse last focused
    event.preventDefault();
    if (event.repeat) return;
    target.click();
  });
  // the mouse takes over again as soon as it moves or clicks
  const mouseTakesOver = (event) => {
    if (!menuNav.active || !event.isTrusted) return;
    if (event.type === "mousemove" && !event.movementX && !event.movementY) return;
    menuNavClear(true);
  };
  document.addEventListener("mousemove", mouseTakesOver, { passive: true });
  document.addEventListener("mousedown", mouseTakesOver, { passive: true });
  new MutationObserver(menuNavScheduleRefresh).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
}

