// Telegram Mini App glue for the Game Y build. The pages call window.GY?.… so they also run without it
// (in the design artifacts and in a plain browser, where Telegram.WebApp has no initData).
(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (!tg || !tg.initData) return;
  const at = v => !!(tg.isVersionAtLeast && tg.isVersionAtLeast(v));
  document.documentElement.classList.add("tg");
  tg.ready();
  tg.expand();
  if (at("7.7")) tg.disableVerticalSwipes();   // a swipe down should not close the game mid-run
  try {
    tg.setHeaderColor("#0b0a0c");
    tg.setBackgroundColor("#0b0a0c");
    if (at("7.10")) tg.setBottomBarColor("#0b0a0c");
  } catch (e) {}
  // full screen on phones; the pages pad themselves with --tg-safe-area-inset-* and --tg-content-safe-area-inset-*
  if (at("8.0") && ["android", "ios"].includes(tg.platform) && !tg.isFullscreen) {
    try { tg.requestFullscreen(); } catch (e) {}
  }

  let onBack = null;
  tg.BackButton.onClick(() => { if (onBack) onBack(); });
  window.GY = {
    back(fn) { onBack = fn; fn ? tg.BackButton.show() : tg.BackButton.hide(); },
    haptic(kind) {
      const h = tg.HapticFeedback;
      if (!h || !at("6.1")) return;
      if (kind === "ok") h.notificationOccurred("success");
      else if (kind === "error") h.notificationOccurred("error");
      else if (kind === "tick") h.selectionChanged();
      else h.impactOccurred(kind);   // light | medium | heavy | rigid | soft
    }
  };
})();
