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

  document.querySelectorAll("[data-sound-setting]").forEach((control) => {
    const key = control.dataset.soundSetting;
    if (key === "muted") {
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
  if (pauseButton) {
    bindOn(pauseButton, "click", () => {
      state.pauseOpen = true;
      state.pauseScreen = "main";
      if (state.mode === "pvp") pvpSetHostPaused(true);
      render();
    });
  }

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
        floatingTooltip.classList.remove("visible");
        floatingTooltip.innerHTML = "";
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

  const inspectButton = document.querySelector("#inspectGame");
  if (inspectButton) {
    bindOn(inspectButton, "click", () => {
      state.inspectingGameOver = true;
      render();
    });
  }
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
    if (isNativeArcadeApp()) pauseGameAudioForBackground();
    return;
  }
  if (isNativeArcadeApp()) {
    if (state.mode === "menu") resumeNativeArcadeOnForeground();
    resumeGameAudioAfterForeground();
  }
});
window.addEventListener("blur", () => {
  if (isNativeArcadeApp()) pauseGameAudioForBackground();
});
window.addEventListener("focus", () => {
  if (isNativeArcadeApp()) resumeGameAudioAfterForeground();
});

loadSoundSettings();
loadDisplaySettings();
installSoundtrack();
installArcadeEnterShortcut();
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
