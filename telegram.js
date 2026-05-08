(function () {
  // Check if we are inside Telegram WebApp
  if (typeof window.Telegram === "undefined" || typeof window.Telegram.WebApp === "undefined") {
    // Not inside Telegram → do nothing
    return;
  }

  // Telegram WebApp detected → initialize safely
  const tg = window.Telegram.WebApp;
  tg.ready(); // Ensure Telegram WebApp is fully initialized

  // Example: Telegram-style custom popup
  function tgPopup(message) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0,0,0,0.6);
      z-index: 999999;
      backdrop-filter: blur(6px);
    `;
    const box = document.createElement("div");
    box.style.cssText = `
      background: #fff;
      color: #222;
      font-family: system-ui, sans-serif;
      padding: 20px 30px;
      border-radius: 14px;
      text-align: center;
      max-width: 85%;
      font-size: 16px;
      line-height: 1.4;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    `;
    box.textContent = message;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 0.3s";
      setTimeout(() => overlay.remove(), 300);
    }, 2000);
  }

  // Show welcome popup
  tgPopup("Welcome! This site only works inside Telegram WebApp.");

  // Add more Telegram-specific logic here
})();
