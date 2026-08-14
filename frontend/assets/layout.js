/* CAPITAL structural shell
 * One DOM definition for the authenticated header/navigation.
 * The visual classes, CSS variables, icons and dimensions are intentionally
 * unchanged; this file only removes duplicated page chrome.
 */
(function () {
  "use strict";

  const HEADER = `<header class="top" role="banner">
  <div class="brand-group">
    <a class="tool profile-tool" href="profile.html" aria-label="Profile" title="Profile">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 20c.8-3.4 3.2-5.2 7-5.2s6.2 1.8 7 5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </a>
    <a class="tool notification-tool" href="notifications.html" aria-label="Notifications" title="Notifications">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 21h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <b class="notification-badge" id="notificationBadge" hidden>0</b>
    </a>
  </div>
  <div class="tools"></div>
</header>`;
  const NAV = `<nav class="bottom" aria-label="ناوبری اصلی">
  <a href="home.html"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3.5 10.6 12 3.5l8.5 7.1v8.1a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M9 20.5v-6.2h6v6.2" fill="none" stroke="currentColor" stroke-width="1.9"/></svg></span><b data-t="home">خانه</b></a>
  <a href="plans.html"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="3.8" width="16" height="16.4" rx="3" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8 8h8M8 12h8M8 16h5.2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg></span><b data-t="plans">پلن‌ها</b></a>
  <a href="history.html"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4.3 10.5a8 8 0 1 1 1.5 6.8" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M4 5.2v5.5h5.4" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 7.1v5l3.1 1.8" fill="none" stroke="currentColor" stroke-width="1.9"/></svg></span><b data-t="history">تاریخچه</b></a>
  <a href="market.html"><span class="chart-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19.5V5M4 19.5h16.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="m6.7 15.2 3.6-3.7 3 2.2 4.5-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></span><b data-t="market">مارکت</b></a>
  <a href="about.html"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.7" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M12 10.2v6.1" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="7.3" r="1.05" fill="currentColor"/></svg></span><b data-t="about">درباره ما</b></a>
</nav>`;

  function mount() {
    const app = document.querySelector(".app");
    const main = document.querySelector("main[data-page-main], main.container");
    if (!app || !main || app.dataset.shellMounted === "1") return;

    app.dataset.shellMounted = "1";
    const existingHeader = app.querySelector(":scope > .top");
    const existingNav = app.querySelector(":scope > .bottom");

    if (!existingHeader) app.insertAdjacentHTML("afterbegin", HEADER);
    if (!existingNav) app.insertAdjacentHTML("beforeend", NAV);

    // Normalize page structure without changing the page's content/classes.
    if (main.parentElement !== app) app.appendChild(main);

    let toast = app.querySelector(":scope > .toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      app.appendChild(toast);
    }
  }

  if (document.readyState === "loading") {
    mount();
  } else {
    mount();
  }
  window.CapitalLayout = { mount };
})();