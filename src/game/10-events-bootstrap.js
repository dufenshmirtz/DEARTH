function bindPvpEvents() {
  if (state.mode !== "pvp" || !state.pvp) return;

  const start = document.querySelector("#pvpReadyLobby");
  if (start) bindOn(start, "click", pvpFillBotsAndStart);

  const addSlot = document.querySelector("#pvpAddSlot");
  if (addSlot) bindOn(addSlot, "click", pvpAddEmptySlot);

  const removeSlot = document.querySelector("#pvpRemoveSlot");
  if (removeSlot) bindOn(removeSlot, "click", pvpRemoveEmptySlot);

  document.querySelectorAll("[data-pvp-remove-slot]").forEach((button) => {
    bindOn(button, "click", () => pvpRemoveLobbySlot(Number(button.dataset.pvpRemoveSlot)));
  });

  const nextRound = document.querySelector("#pvpNextRound");
  if (nextRound) {
    bindOn(nextRound, "click", () => {
      playNextRoundSfx();
      pvpNextRound();
    });
  }

  const restart = document.querySelector("#pvpRestart");
  if (restart) bindOn(restart, "click", restartPvpMode);
}

function bindEvents() {
  document.querySelectorAll("[data-menu-action]").forEach((button) => {
    bindOn(button, "click", () => handleMenuAction(button.dataset.menuAction));
  });

  document.querySelectorAll("[data-run-slot-id]").forEach((button) => {
    bindOn(button, "click", () => {
      if (loadArcadeRun(button.dataset.runSlotId)) {
        resumeSoundtrack();
        render();
      } else {
        startGame();
      }
    });
  });

  document.querySelectorAll("[data-new-run]").forEach((button) => {
    bindOn(button, "click", () => startGame());
  });

  document.querySelectorAll("[data-remove-run-slot-id]").forEach((button) => {
    bindOn(button, "click", () => requestRunRemoval(button.dataset.removeRunSlotId));
  });

  document.querySelectorAll("[data-confirm-remove-run]").forEach((button) => {
    bindOn(button, "click", () => confirmRunRemoval(button.dataset.confirmRemoveRun));
  });

  document.querySelectorAll("[data-cancel-remove-run]").forEach((button) => {
    bindOn(button, "click", cancelRunRemoval);
  });

  document.querySelectorAll("[data-display-setting]").forEach((control) => {
    bindOn(control, "input", () => updateDisplaySetting(control.dataset.displaySetting, control.value));
  });

  document.querySelectorAll("[data-settings-tab]").forEach((button) => {
    bindOn(button, "click", () => {
      state.settingsTab = button.dataset.settingsTab;
      render();
    });
  });

  document.querySelectorAll("[data-setting-choice]").forEach((button) => {
    bindOn(button, "click", () => updateSettingChoice(button.dataset.settingChoice, Number(button.dataset.step) || 1));
  });

  document.querySelectorAll("[data-settings-reset]").forEach((button) => {
    bindOn(button, "click", resetSettings);
  });

  document.querySelectorAll("[data-settings-replay-story]").forEach((button) => {
    bindOn(button, "click", () => startIntroSequence({ fromMenu: true }));
  });

  document.querySelectorAll("[data-sound-setting]").forEach((control) => {
    const key = control.dataset.soundSetting;
    if (control.type === "checkbox") {
      bindOn(control, "change", () => updateSoundSetting(key, control.checked));
      return;
    }
    bindOn(control, "input", () => {
      updateSoundSetting(key, control.value, false);
      document.querySelectorAll(`[data-sound-value="${key}"]`).forEach((valueLabel) => {
        valueLabel.textContent = `${control.value}%`;
      });
    });
  });

  const pauseButton = document.querySelector("#pauseButton");
  if (pauseButton) bindOn(pauseButton, "click", openPauseMenu);

  const playtestMoney = document.querySelector("#playtestMoney");
  if (playtestMoney) bindOn(playtestMoney, "click", togglePlaytestMoneyMode);

  const skipProgression = document.querySelector("#skipProgression");
  if (skipProgression) bindOn(skipProgression, "click", skipArcadeProgression);

  const mobileOfferingsToggle = document.querySelector("#mobileOfferingsToggle");
  if (mobileOfferingsToggle) {
    bindOn(mobileOfferingsToggle, "click", () => {
      state.mobileOfferingsOpen = true;
      render();
    });
  }

  const mobileOfferingsClose = document.querySelector("#mobileOfferingsClose");
  if (mobileOfferingsClose) {
    bindOn(mobileOfferingsClose, "click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  const mobileOfferingsBackdrop = document.querySelector("#mobileOfferingsBackdrop");
  if (mobileOfferingsBackdrop) {
    bindOn(mobileOfferingsBackdrop, "click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  document.querySelectorAll("[data-pause-action]").forEach((button) => {
    bindOn(button, "click", () => handlePauseAction(button.dataset.pauseAction));
  });

  bindPvpEvents();
  bindCollectionEvents();

  const mainAction = document.querySelector("#mainAction");
  if (mainAction) {
    bindOn(mainAction, "click", performMainAction);
  }

  const guessInput = document.querySelector("#guessInput");
  if (guessInput) {
    bindOn(guessInput, "keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performMainAction();
      }
    });
  }

  document.querySelectorAll("[data-numpad-key]").forEach((button) => {
    bindOn(button, "click", () => {
      handleMobileNumpadKey(button.dataset.numpadKey);
      button.blur();
    });
  });

  document.querySelectorAll("[data-buy]").forEach((button) => {
    bindOn(button, "click", () => buyShopItem(Number(button.dataset.buy)));
  });

  document.querySelectorAll("[data-sell-passive]").forEach((button) => {
    bindOn(button, "click", () => sellPassive(Number(button.dataset.sellPassive)));
  });

  document.querySelectorAll("[data-sell-active]").forEach((button) => {
    bindOn(button, "click", () => sellActive(Number(button.dataset.sellActive)));
  });

  document.querySelectorAll("[data-use-active]").forEach((button) => {
    bindOn(button, "click", () => useActive(Number(button.dataset.useActive)));
  });

  document.querySelectorAll("[data-active-prev]").forEach((button) => {
    bindOn(button, "click", () => moveActiveCarousel(-1));
  });

  document.querySelectorAll("[data-active-next]").forEach((button) => {
    bindOn(button, "click", () => moveActiveCarousel(1));
  });

  const cancelActive = document.querySelector("#cancelPendingActive");
  if (cancelActive) bindOn(cancelActive, "click", cancelPendingActive);

  const floatingTooltip = document.querySelector("#floatingTooltip");
  if (floatingTooltip) {
    document.querySelectorAll("[data-tooltip], [data-tooltip-html]").forEach((element) => {
      bindOn(element, "mouseenter", (event) => {
        if (touchTooltipMode()) setShiftTooltipMore(false); // on the phone every tooltip opens short
        floatingTooltipOwner = element;
        if (element.dataset.tooltipHtml) {
          floatingTooltip.innerHTML = element.dataset.tooltipHtml;
        } else {
          floatingTooltip.innerHTML = descriptionHtml(element.dataset.tooltip);
        }
        floatingTooltip.classList.add("visible");
        positionFloatingTooltip(event, floatingTooltip);
      });
      bindOn(element, "mousemove", (event) => {
        positionFloatingTooltip(event, floatingTooltip);
      });
      bindOn(element, "mouseleave", () => {
        // phone: tapping More inside the tooltip moves the "hover" off the SEAL; keep it open
        if (touchTooltipMode() && Date.now() - floatingTooltipTouchedAt < 1000) return;
        hideFloatingTooltip();
      });
    });
  }

  document.querySelectorAll("[data-pick-bot]").forEach((button) => {
    bindOn(button, "click", () => chooseBot(Number(button.dataset.pickBot)));
  });

  const rerollButton = document.querySelector("#rerollShop");
  if (rerollButton) bindOn(rerollButton, "click", rerollShopClick);

  const restartButton = document.querySelector("#restartGame");
  if (restartButton) bindOn(restartButton, "click", startGame);

  const gameOverMenuButton = document.querySelector("#gameOverMenu");
  if (gameOverMenuButton) bindOn(gameOverMenuButton, "click", () => showMainMenu());

  const inspectButton = document.querySelector("#inspectGame");
  if (inspectButton) {
    bindOn(inspectButton, "click", () => {
      state.inspectingGameOver = true;
      render();
    });
  }
}

function openPauseMenu() {
  state.pauseOpen = true;
  state.pauseScreen = "main";
  if (state.mode === "pvp") pvpSetHostPaused(true);
  render();
}

// Esc: opens Pause during a run; inside Pause it goes back one screen, then resumes.
// While an ARTIFACT is waiting for its target, Esc cancels that first.
// The intro and the collection handle their own Esc (they mark the event as handled).
function installPauseEscapeShortcut() {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented || event.repeat) return;
    if (state.mode !== "arcade" && state.mode !== "pvp") return;
    if (introCapturesInput()) return;
    if (state.gameOver && !state.inspectingGameOver && !state.pauseOpen) return;
    event.preventDefault();
    if (state.pauseOpen) {
      handlePauseAction(state.pauseScreen && state.pauseScreen !== "main" ? "back" : "resume");
      return;
    }
    if (state.pendingActive) {
      cancelPendingActive();
      return;
    }
    if (state.mobileOfferingsOpen) {
      state.mobileOfferingsOpen = false;
      render();
      return;
    }
    openPauseMenu();
  });
}

function saveArcadeRunForNativeExit() {
  markNativeArcadeResumeOnForeground();
  saveArcadeRun();
}

function blockNativeSelection(event) {
  if (isNativeArcadeApp()) event.preventDefault();
}

function installNativeSelectionGuards() {
  if (!isNativeArcadeApp()) return;
  document.addEventListener("selectstart", blockNativeSelection, { passive: false });
  document.addEventListener("contextmenu", blockNativeSelection, { passive: false });
  document.addEventListener("dragstart", blockNativeSelection, { passive: false });
}

window.addEventListener("resize", updateFullscreenLayoutClass);
window.addEventListener("pagehide", saveArcadeRunForNativeExit);
window.addEventListener("beforeunload", saveArcadeRunForNativeExit);
document.addEventListener("fullscreenchange", updateFullscreenLayoutClass);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    saveArcadeRunForNativeExit();
    if (muteWhenInBackground()) pauseGameAudioForBackground();
    return;
  }
  if (isNativeArcadeApp() && state.mode === "menu") resumeNativeArcadeOnForeground();
  if (muteWhenInBackground()) resumeGameAudioAfterForeground();
});
// Settings > Audio > Mute in background (always on in the phone app)
function muteWhenInBackground() {
  return isNativeArcadeApp() || state.sound.muteInBackground !== false;
}

window.addEventListener("blur", () => {
  if (muteWhenInBackground()) pauseGameAudioForBackground();
});
window.addEventListener("focus", () => {
  if (muteWhenInBackground()) resumeGameAudioAfterForeground();
});
document.addEventListener("fullscreenchange", () => {
  document.querySelectorAll('[data-setting-value="fullscreen"]').forEach((label) => {
    label.textContent = document.fullscreenElement ? "Fullscreen" : "Windowed";
  });
});

loadSoundSettings();
loadDisplaySettings();
installAnimationSpeed();
installSoundtrack();
installArcadeEnterShortcut();
installPauseEscapeShortcut();
installShiftTooltipMore();
installNativeSelectionGuards();
updateFullscreenLayoutClass();
if (!resumeNativeArcadeOnForeground()) {
  if (pvpShouldAutoStartFromHash()) {
    if (window.history?.replaceState) window.history.replaceState(null, "", `${location.pathname}${location.search}`);
    startPvpMode();
  } else if (shouldPlayIntroOnLaunch()) {
    startIntroSequence();
  } else {
    showMainMenu();
  }
}
