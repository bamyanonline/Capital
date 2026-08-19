/* CAPITAL Market Controller
 * Single responsibility: fetch market snapshots, render one semantic table,
 * and patch live Binance prices without rebuilding the DOM.
 */
(function () {
  "use strict";

  const COINS = [
    ["bitcoin", "BTCUSDT"], ["ethereum", "ETHUSDT"], ["tether", null],
    ["binancecoin", "BNBUSDT"], ["ripple", "XRPUSDT"], ["solana", "SOLUSDT"],
    ["usd-coin", "USDCUSDT"], ["dogecoin", "DOGEUSDT"], ["cardano", "ADAUSDT"],
    ["tron", "TRXUSDT"]
  ];


  const LOCALES = {fa:"en-US",ar:"en-US",ur:"en-US",en:"en-US",fr:"en-US",ru:"en-US",zh:"en-US",es:"en-US"};

  let coins = [];
  let socket = null;
  let retry = 0;
  let reconnectTimer = null;

  const locale = () => "en-US";

  const finite = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const number = (value) => {
    const n = finite(value);
    return new Intl.NumberFormat(locale(), {
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: n < 1 ? 6 : 2
    }).format(n);
  };

  const percent = (value) => new Intl.NumberFormat(locale(), { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(finite(value));

  const compact = (value) => {
    const n = Math.max(0, finite(value));
    if (n >= 1e12) return number(n / 1e12) + "T";
    if (n >= 1e9) return number(n / 1e9) + "B";
    if (n >= 1e6) return number(n / 1e6) + "M";
    return number(n);
  };

  const body = () => document.getElementById("marketRows");
  const statusEl = () => document.getElementById("marketLiveStatus");

  function translate(key, fallback) {
    try {
      const dictionary = window.lang && typeof window.lang === "function" ? window.lang() : null;
      return dictionary && dictionary[key] ? dictionary[key] : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setStatus(key) {
    const el = statusEl();
    if (!el) return;
    el.dataset.t = key;
    el.textContent = translate(
      key,
      key === "marketUnavailable"
        ? "دریافت آمار زنده بازار موقتاً امکان‌پذیر نیست."
        : "وضعیت زنده بازار"
    );
    el.classList.toggle("is-live", key === "marketLiveStatus");
    el.classList.toggle("is-unavailable", key === "marketUnavailable");
  }

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));

  function unavailable() {
    setStatus("marketUnavailable");
    const target = body();
    if (target) {
      target.innerHTML =
        '<tr class="market-state"><td colspan="5">' +
        escapeHtml(translate("marketUnavailable", "Market data unavailable")) +
        "</td></tr>";
    }
  }

  function render() {
    const target = body();
    if (!target) return;
    if (!coins.length) {
      unavailable();
      return;
    }

    setStatus("marketLiveStatus");

    target.innerHTML = coins.map((coin, index) => {
      const change = finite(coin.price_change_percentage_24h);
      const positive = change >= 0;
      const image = coin.image || "";
      const name = coin.name || coin.id || "";
      const symbol = String(coin.symbol || "").toUpperCase();

      return '<tr data-id="' + escapeHtml(coin.id) + '">' +
        '<td class="market-rank">' + number(index + 1) + "</td>" +
        '<td class="market-coin-cell"><div class="market-coin">' +
          '<img src="' + escapeHtml(image) + '" alt="" loading="lazy">' +
          '<span class="market-coin-name">' + escapeHtml(name) + '</span>' +
          '<small class="market-coin-symbol">' + escapeHtml(symbol) + "</small>" +
        "</div></td>" +
        '<td class="market-price" data-price><span class="market-number">' +
          number(coin.current_price) + '</span><span class="market-currency">USD</span></td>' +
        '<td class="market-change ' + (positive ? "up" : "down") + '" data-change>' +
          '<span class="market-change-value">' + (positive ? "+" : "") + percent(change) +
          '</span><span class="market-unit">%</span></td>' +
        '<td class="market-cap"><span class="market-number">' +
          compact(coin.market_cap) + '</span><span class="market-currency">USD</span></td>' +
      "</tr>";
    }).join("");
  }

  function findRow(id) {
    const target = body();
    if (!target) return null;
    return Array.from(target.querySelectorAll("tr[data-id]"))
      .find(row => row.dataset.id === id) || null;
  }

  function patchLiveRow(coin) {
    const row = findRow(coin.id);
    if (!row) return;

    const price = row.querySelector("[data-price] .market-number");
    const change = row.querySelector("[data-change]");
    const changeValue = row.querySelector("[data-change] .market-change-value");
    const value = finite(coin.current_price);
    const delta = finite(coin.price_change_percentage_24h);
    const positive = delta >= 0;

    if (price) price.textContent = number(value);
    if (changeValue) changeValue.textContent = (positive ? "+" : "") + percent(delta);
    if (change) {
      change.classList.toggle("up", positive);
      change.classList.toggle("down", !positive);
    }
  }

  async function load() {
    try {
      const response = await fetch("/api/market", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("MARKET_API");

      const fresh = await response.json();
      if (!Array.isArray(fresh)) throw new Error("MARKET_DATA");

      coins = fresh
        .filter(item => item && item.id)
        .sort((a, b) => finite(b.market_cap) - finite(a.market_cap));

      render();
      retry = 0;
      connect();
    } catch (_) {
      if (!coins.length) unavailable();
      scheduleReconnect();
    }
  }

  function connect() {
    if (socket) {
      try { socket.close(); } catch (_) {}
      socket = null;
    }

    const streams = COINS
      .map(([, symbol]) => symbol)
      .filter(Boolean)
      .map(symbol => symbol.toLowerCase() + "@ticker")
      .join("/");

    if (!streams || typeof WebSocket === "undefined") return;

    try {
      socket = new WebSocket(
        "wss://stream.binance.com:9443/stream?streams=" + streams
      );

      socket.onopen = () => {
        retry = 0;
        setStatus("marketLiveStatus");
      };

      socket.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          const ticker = payload && payload.data ? payload.data : {};
          const coin = coins.find(item => {
            const match = COINS.find(pair => pair[0] === item.id);
            return match && match[1] === ticker.s;
          });
          if (!coin) return;

          coin.current_price = finite(ticker.c);
          coin.price_change_percentage_24h = finite(ticker.P);
          patchLiveRow(coin);
        } catch (_) {}
      };

      socket.onerror = () => {
        try { socket.close(); } catch (_) {}
      };

      socket.onclose = () => scheduleReconnect();
    } catch (_) {
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    retry = Math.min(retry + 1, 6);
    const delay = Math.min(30000, 1000 * Math.pow(2, retry - 1));
    reconnectTimer = setTimeout(connect, delay);
  }

  function clock() {
    const el = document.getElementById("marketClock");
    if (!el) return;
    el.textContent = new Intl.DateTimeFormat(locale(), {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(new Date());
  }

  setInterval(clock, 1000);
  setInterval(load, 60000);
  document.addEventListener("capital:language", clock);
  document.addEventListener("DOMContentLoaded", () => {
    clock();
    load();
  });
})();
