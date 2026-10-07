function bindPvpEvents() {
  if (state.mode !== "pvp" || !state.pvp) return;

  const addLocal = document.querySelector("#pvpAddLocal");
  if (addLocal) {
    addLocal.addEventListener("click", () => {
      const input = document.querySelector("#pvpLocalName");
      pvpAddLocalPlayer(input?.value || "");
    });
  }

  const localName = document.querySelector("#pvpLocalName");
  if (localName) {
    localName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") pvpAddLocalPlayer(localName.value);
    });
  }

  const readyLobby = document.querySelector("#pvpReadyLobby");
  if (readyLobby) readyLobby.addEventListener("click", pvpFillBotsAndStart);

  const addSlot = document.querySelector("#pvpAddSlot");
  if (addSlot) addSlot.addEventListener("click", pvpAddEmptySlot);

  document.querySelectorAll("[data-pvp-remove-slot]").forEach((button) => {
    button.addEventListener("click", () => pvpRemoveLobbySlot(Number(button.dataset.pvpRemoveSlot)));
  });

  document.querySelectorAll("[data-pvp-save-guess]").forEach((button) => {
    button.addEventListener("click", () => {
      const slot = Number(button.dataset.pvpSaveGuess);
      const input = document.querySelector(`#pvpGuess-${slot}`);
      pvpSetLocalGuess(slot, input?.value);
    });
  });

  const revealTarget = document.querySelector("#pvpRevealTarget");
  if (revealTarget) revealTarget.addEventListener("click", pvpPrepareActivePhase);

  const waitToggle = document.querySelector("#pvpWaitToggle");
  if (waitToggle) waitToggle.addEventListener("click", pvpToggleWait);

  document.querySelectorAll("[data-pvp-active-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const [slotText, activeId] = button.dataset.pvpActiveChoice.split(":");
      const slot = Number(slotText);
      const select = document.querySelector(`[data-pvp-target-for="${slot}-${activeId}"]`);
      pvpSetActiveChoice(slot, activeId, select?.value || null);
    });
  });

  const resolveActives = document.querySelector("#pvpResolveActives");
  if (resolveActives) {
    resolveActives.addEventListener("click", () => {
      playReadySfx();
      pvpResolveActives();
    });
  }

  const nextRound = document.querySelector("#pvpNextRound");
  if (nextRound) {
    nextRound.addEventListener("click", () => {
      playNextRoundSfx();
      pvpNextRound();
    });
  }

  const restart = document.querySelector("#pvpRestart");
  if (restart) restart.addEventListener("click", restartPvpMode);
}

function bindEvents() {
  document.querySelectorAll("[data-menu-action]").forEach((button) => {
    button.addEventListener("click", () => handleMenuAction(button.dataset.menuAction));
  });

  document.querySelectorAll("[data-run-slot-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (loadArcadeRun(button.dataset.runSlotId)) {
        resumeSoundtrack();
        render();
      } else {
        startGame();
      }
    });
  });

  document.querySelectorAll("[data-new-run]").forEach((button) => {
    button.addEventListener("click", () => startGame());
  });

  document.querySelectorAll("[data-remove-run-slot-id]").forEach((button) => {
    button.addEventListener("click", () => requestRunRemoval(button.dataset.removeRunSlotId));
  });

  document.querySelectorAll("[data-confirm-remove-run]").forEach((button) => {
    button.addEventListener("click", () => confirmRunRemoval(button.dataset.confirmRemoveRun));
  });

  document.querySelectorAll("[data-cancel-remove-run]").forEach((button) => {
    button.addEventListener("click", cancelRunRemoval);
  });

  document.querySelectorAll("[data-sound-setting]").forEach((control) => {
    const key = control.dataset.soundSetting;
    if (key === "muted") {
      control.addEventListener("change", () => updateSoundSetting(key, control.checked));
      return;
    }
    control.addEventListener("input", () => {
      updateSoundSetting(key, control.value, false);
      document.querySelectorAll(`[data-sound-value="${key}"]`).forEach((valueLabel) => {
        valueLabel.textContent = `${control.value}%`;
      });
    });
  });

  const pauseButton = document.querySelector("#pauseButton");
  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      state.pauseOpen = true;
      render();
    });
  }

  const playtestMoney = document.querySelector("#playtestMoney");
  if (playtestMoney) playtestMoney.addEventListener("click", togglePlaytestMoneyMode);

  const skipProgression = document.querySelector("#skipProgression");
  if (skipProgression) skipProgression.addEventListener("click", skipArcadeProgression);

  const mobileOfferingsToggle = document.querySelector("#mobileOfferingsToggle");
  if (mobileOfferingsToggle) {
    mobileOfferingsToggle.addEventListener("click", () => {
      state.mobileOfferingsOpen = true;
      render();
    });
  }

  const mobileOfferingsClose = document.querySelector("#mobileOfferingsClose");
  if (mobileOfferingsClose) {
    mobileOfferingsClose.addEventListener("click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  const mobileOfferingsBackdrop = document.querySelector("#mobileOfferingsBackdrop");
  if (mobileOfferingsBackdrop) {
    mobileOfferingsBackdrop.addEventListener("click", () => {
      state.mobileOfferingsOpen = false;
      render();
    });
  }

  document.querySelectorAll("[data-pause-action]").forEach((button) => {
    button.addEventListener("click", () => handlePauseAction(button.dataset.pauseAction));
  });

  bindPvpEvents();

  const mainAction = document.querySelector("#mainAction");
  if (mainAction) {
    mainAction.addEventListener("click", performMainAction);
  }

  const guessInput = document.querySelector("#guessInput");
  if (guessInput) {
    guessInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performMainAction();
      }
    });
  }

  document.querySelectorAll("[data-numpad-key]").forEach((button) => {
    button.addEventListener("click", () => {
      handleMobileNumpadKey(button.dataset.numpadKey);
      button.blur();
    });
  });

  document.querySelectorAll("[data-buy]").forEach((button) => {
    button.addEventListener("click", () => buyShopItem(Number(button.dataset.buy)));
  });

  document.querySelectorAll("[data-sell-passive]").forEach((button) => {
    button.addEventListener("click", () => sellPassive(Number(button.dataset.sellPassive)));
  });

  document.querySelectorAll("[data-sell-active]").forEach((button) => {
    button.addEventListener("click", () => sellActive(Number(button.dataset.sellActive)));
  });

  document.querySelectorAll("[data-use-active]").forEach((button) => {
    button.addEventListener("click", () => useActive(Number(button.dataset.useActive)));
  });

  document.querySelectorAll("[data-active-prev]").forEach((button) => {
    button.addEventListener("click", () => moveActiveCarousel(-1));
  });

  document.querySelectorAll("[data-active-next]").forEach((button) => {
    button.addEventListener("click", () => moveActiveCarousel(1));
  });

  const cancelActive = document.querySelector("#cancelPendingActive");
  if (cancelActive) cancelActive.addEventListener("click", cancelPendingActive);

  const floatingTooltip = document.querySelector("#floatingTooltip");
  if (floatingTooltip) {
    document.querySelectorAll("[data-tooltip], [data-tooltip-html]").forEach((element) => {
      element.addEventListener("mouseenter", (event) => {
        if (element.dataset.tooltipHtml) {
          floatingTooltip.innerHTML = element.dataset.tooltipHtml;
        } else {
          floatingTooltip.innerHTML = descriptionHtml(element.dataset.tooltip);
        }
        floatingTooltip.classList.add("visible");
        positionFloatingTooltip(event, floatingTooltip);
      });
      element.addEventListener("mousemove", (event) => {
        positionFloatingTooltip(event, floatingTooltip);
      });
      element.addEventListener("mouseleave", () => {
        floatingTooltip.classList.remove("visible");
        floatingTooltip.innerHTML = "";
      });
    });
  }

  document.querySelectorAll("[data-pick-bot]").forEach((button) => {
    button.addEventListener("click", () => chooseBot(Number(button.dataset.pickBot)));
  });

  const rerollButton = document.querySelector("#rerollShop");
  if (rerollButton) rerollButton.addEventListener("click", rerollShopClick);

  const restartButton = document.querySelector("#restartGame");
  if (restartButton) restartButton.addEventListener("click", startGame);

  const inspectButton = document.querySelector("#inspectGame");
  if (inspectButton) {
    inspectButton.addEventListener("click", () => {
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
installSoundtrack();
installArcadeEnterShortcut();
installShiftTooltipMore();
installNativeSelectionGuards();
updateFullscreenLayoutClass();
if (!resumeNativeArcadeOnForeground()) {
  if (pvpShouldAutoStartFromHash()) {
    if (window.history?.replaceState) window.history.replaceState(null, "", `${location.pathname}${location.search}`);
    startPvpMode();
  } else {
    showMainMenu();
  }
}
