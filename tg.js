// Telegram Mini App glue for the Game Y build. The pages call window.GY?.… so they also run without it
// (in the design artifacts and in a plain browser, where Telegram.WebApp has no initData).

// A clean start for testing: the bot link t.me/<bot>?startapp=reset (or a page opened with ?reset) wipes the
// progress before the page reads it. Telegram keeps the start param for the whole launch, so it runs once per launch.
(() => {
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    const asked = (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param === "reset") || /[?&]reset\b/.test(location.search);
    if (!asked || sessionStorage.getItem("gamey.reset")) return;
    Object.keys(localStorage).filter(k => k.startsWith("gamey.")).forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => k.startsWith("gamey.")).forEach(k => sessionStorage.removeItem(k));   // not Telegram's own launch data
    sessionStorage.setItem("gamey.reset", "1");
  } catch (e) {}
})();

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
  // Stars: the game's one door to payments (tech passport: the store builds swap this layer for their own billing).
  // No server yet, so INVOICE is empty and the page's own "Telegram payment" stub answers. With a server: it makes an
  // invoice link (createInvoiceLink, currency XTR), Telegram shows it, and the goods are granted only by the server on
  // successful_payment, once per telegram_payment_charge_id; "paid" here only tells the page to fetch them.
  const INVOICE = null;   // e.g. "https://<server>/invoice?sku="
  window.GY = {
    back(fn) { onBack = fn; fn ? tg.BackButton.show() : tg.BackButton.hide(); },
    pay(sku, stub) {   // → Promise<boolean>: paid or not
      if (!INVOICE || !at("6.1")) return stub();
      return fetch(INVOICE + encodeURIComponent(sku), { headers: { "X-Init-Data": tg.initData } })
        .then(r => r.json())
        .then(({ link }) => new Promise(done => tg.openInvoice(link, status => done(status === "paid"))));
    },
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
