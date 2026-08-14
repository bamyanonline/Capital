/* CAPITAL Frontend Data Layer
 *
 * The UI talks to this adapter instead of reading/writing financial data directly.
 * Default mode is a local mock so the static frontend remains usable.
 * When a backend is ready, set CAPITAL_CONFIG.mode = "backend" and keep the page UI unchanged.
 */
window.CAPITAL_CONFIG = window.CAPITAL_CONFIG || {
  mode: "backend",
  apiBaseUrl: "",
  deposit: {
    network: "TRC20",
    currency: "USDT",
    address: "TFLkxFWGRQqS8rdiEbPFPqWrbke7fssf5c",
    minAmount: 100
  },
  withdrawal: { network: "TRC20", currency: "USDT", minAmount: 10 },
  sessionMinutes: 30
};

(function () {
  const KEY = "capitalMockDB";
  const SESSION = "capitalSession";
  const LEGACY = "capitalLogged";
  const EMAIL = "capitalEmail";

  const now = () => new Date().toISOString();
  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch (_) { return null; }
  };
  const write = db => localStorage.setItem(KEY, JSON.stringify(db));
  const safeEmail = v => String(v || "").trim().toLowerCase();
  const id = prefix => prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  function referralId(users) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let value;
    do {
      value = "CAP-" + Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    } while (users.some(u => u.referralId === value));
    return value;
  }

  function initialDB() {
    return { version: 3, users: [], deposits: [], withdrawals: [], sessions: [], adminAnnouncements: [], meta: { createdAt: now() } };
  }

  function ensureDB() {
    let db = read() || initialDB();
    db.users ||= [];
    db.deposits ||= [];
    db.withdrawals ||= [];
    db.sessions ||= [];
    db.adminAnnouncements ||= [];
    db.meta ||= { createdAt: now() };

    // One-way migration from the old prototype storage. This preserves existing
    // profile/deposit data while moving the UI away from direct localStorage use.
    if (!db.meta.migratedLegacy) {
      try {
        const oldUsers = JSON.parse(localStorage.getItem("capitalUsers") || "[]");
        oldUsers.forEach(old => {
          const email = safeEmail(old.email);
          if (!email || db.users.some(u => safeEmail(u.email) === email)) return;
          db.users.push(normalizeUser({
            ...old,
            email,
            balance: Number(old.balance || 0),
            activePlan: old.activePlan || null,
            available: Number(old.available ?? old.balance ?? 0),
            investedCapital: Number(old.investedCapital ?? old.balance ?? 0),
            dailyProfit: Number(old.dailyProfit || 0),
            teamProfit: Number(old.teamProfit || 0),
            totalProfit: Number(old.totalProfit || 0),
            totalWithdrawals: Number(old.totalWithdrawals || 0)
          }));
        });
        const email = safeEmail(localStorage.getItem(EMAIL));
        if (email && !db.users.some(u => safeEmail(u.email) === email)) {
          db.users.push(normalizeUser({ id: id("USR"), email, name: localStorage.getItem("capitalName") || "", family: localStorage.getItem("capitalFamily") || "", createdAt: localStorage.getItem("capitalCreated") || now(), balance: Number(localStorage.getItem("capitalBalance") || 0) }));
        }
        const oldDeposits = JSON.parse(localStorage.getItem("capitalDepositRequests") || "[]");
        oldDeposits.forEach(d => { if (d && d.id && !db.deposits.some(x => x.id === d.id)) db.deposits.push({ ...d, status: d.status || "pending", verificationStatus: d.verificationStatus || "pending", createdAt: d.createdAt || d.date || now() }); });
        const oldWithdrawals = JSON.parse(localStorage.getItem("capitalWithdrawalRequests") || "[]");
        oldWithdrawals.forEach(w => { if (w && w.id && !db.withdrawals.some(x => x.id === w.id)) db.withdrawals.push({ ...w, status: w.status || "pending", createdAt: w.createdAt || w.date || now() }); });
      } catch (_) {}
      db.meta.migratedLegacy = true;
      write(db);
    }
    return db;
  }

  function normalizeUser(user) {
    return {
      id: user.id || id("USR"),
      referralId: user.referralId || "",
      name: user.name || "",
      family: user.family || "",
      email: safeEmail(user.email),
      passwordHash: user.passwordHash || "",
      status: user.status || "active",
      createdAt: user.createdAt || now(),
      lastLoginAt: user.lastLoginAt || null,
      wallet: user.wallet || "",
      referredBy: user.referredBy || "",
      balance: Number(user.balance || 0),
      available: Number(user.available ?? user.balance ?? 0),
      investedCapital: Number(user.investedCapital ?? user.balance ?? 0),
      dailyProfit: Number(user.dailyProfit || 0),
      teamProfit: Number(user.teamProfit || 0),
      totalProfit: Number(user.totalProfit || 0),
      totalWithdrawals: Number(user.totalWithdrawals || 0),
      activePlan: user.activePlan || null,
      notificationReadIds: Array.isArray(user.notificationReadIds) ? user.notificationReadIds : []
    };
  }

  async function hash(value) {
    if (window.crypto?.subtle) {
      const bytes = new TextEncoder().encode(String(value));
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
    }
    // Mock-only fallback. A real backend must hash passwords server-side.
    return btoa(unescape(encodeURIComponent(String(value))));
  }

  function currentToken() { return localStorage.getItem(SESSION) || ""; }
  function sessionUserId() {
    const token = currentToken();
    const db = ensureDB();
    const session = db.sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
    return session?.userId || "";
  }
  function currentUserFromDB(db = ensureDB()) {
    const uid = sessionUserId();
    return uid ? db.users.find(u => u.id === uid) || null : null;
  }

  async function mockRegister(payload) {
    const db = ensureDB();
    const email = safeEmail(payload.email);
    if (!email) throw new Error("EMAIL_REQUIRED");
    if (db.users.some(u => safeEmail(u.email) === email)) throw new Error("EMAIL_EXISTS");
    const users = db.users;
    const user = normalizeUser({
      id: id("USR"), referralId: referralId(users), name: payload.name, family: payload.family,
      email, passwordHash: await hash(payload.password), createdAt: now(), referredBy: payload.referredBy || ""
    });
    db.users.push(user);
    write(db);
    await createSession(user.id);
    return sanitizeUser(user);
  }

  async function createSession(userId) {
    const db = ensureDB();
    const token = "cap_" + cryptoRandom();
    const expiresAt = new Date(Date.now() + CAPITAL_CONFIG.sessionMinutes * 60000).toISOString();
    db.sessions = db.sessions.filter(s => new Date(s.expiresAt) > new Date());
    db.sessions.push({ token, userId, createdAt: now(), expiresAt, lastActiveAt: now(), device: (typeof navigator !== "undefined" ? navigator.userAgent : "Browser").slice(0,140) });
    write(db);
    localStorage.setItem(SESSION, token);
    localStorage.setItem(LEGACY, "1");
    return token;
  }
  function cryptoRandom() {
    if (window.crypto?.getRandomValues) return Array.from(crypto.getRandomValues(new Uint32Array(4))).map(n => n.toString(36)).join("");
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function mockLogin(email, password) {
    const db = ensureDB();
    const user = db.users.find(u => safeEmail(u.email) === safeEmail(email));
    if (!user) throw new Error("INVALID_CREDENTIALS");
    // Legacy users have no password. Force a clean password setup instead of
    // silently accepting any password.
    if (!user.passwordHash) throw new Error("PASSWORD_SETUP_REQUIRED");
    if (user.passwordHash !== await hash(password)) throw new Error("INVALID_CREDENTIALS");
    user.lastLoginAt = now();
    write(db);
    await createSession(user.id);
    return sanitizeUser(user);
  }

  function sanitizeUser(u) {
    if (!u) return null;
    const { passwordHash, ...safe } = u;
    return safe;
  }

  function dashboardFromUser(user, db) {
    if (!user) return null;
    const pendingWithdraw = db.withdrawals.filter(w => w.userId === user.id && w.status === "pending").reduce((s, w) => s + Number(w.amount || 0), 0);
    return {
      investedCapital: Number(user.investedCapital || 0),
      dailyProfit: Number(user.dailyProfit || 0),
      teamProfit: Number(user.teamProfit || 0),
      totalProfit: Number(user.totalProfit || 0),
      available: Math.max(0, Number(user.available || 0) - pendingWithdraw),
      totalWithdrawals: Number(user.totalWithdrawals || 0),
      balance: Number(user.balance || 0),
      activePlan: user.activePlan || null,
      notificationReadIds: Array.isArray(user.notificationReadIds) ? user.notificationReadIds : []
    };
  }

  function teamStats(user, db) {
    if (!user) return { directMembers: 0, teamMembers: 0 };
    const direct = db.users.filter(u => u.referredBy === user.referralId);
    const seen = new Set(); const queue = direct.map(u => u.id);
    while (queue.length) { const uid = queue.shift(); if (seen.has(uid)) continue; seen.add(uid); const child = db.users.find(u => u.id === uid); if (!child) continue; db.users.filter(u => u.referredBy === child.referralId).forEach(u => queue.push(u.id)); }
    return { directMembers: direct.length, teamMembers: seen.size };
  }
  function notificationItems(user, db) {
    if (!user) return [];
    const readIds = new Set(user.notificationReadIds || []);
    const withdrawals = db.withdrawals.filter(w => w.userId === user.id && ['completed','approved','success','rejected'].includes(String(w.status||'').toLowerCase())).map(w => {
      const status = String(w.status||'').toLowerCase(); const id = 'withdrawal:'+w.id+':'+status;
      return { id, kind:'withdrawal', status: status==='rejected'?'rejected':'success', title: status==='rejected'?'درخواست برداشت رد شد':'درخواست برداشت با موفقیت انجام شد', body: status==='rejected' ? (w.rejectReason || 'درخواست برداشت شما توسط مدیریت رد شده است.') : ('برداشت '+Number(w.amount||0).toFixed(2)+' USDT با موفقیت پردازش شد.'), createdAt:w.processedAt||w.createdAt, read:readIds.has(id) };
    });
    const announcements = db.adminAnnouncements.filter(a => !a.userId || a.userId===user.id).map(a => ({ id:'announcement:'+a.id, kind:'admin', status:'info', title:a.title||'اطلاعیه مدیریت', body:a.body||'', createdAt:a.createdAt||now(), read:readIds.has('announcement:'+a.id) }));
    return [...withdrawals,...announcements].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }

  const mock = {
    async me() { return sanitizeUser(currentUserFromDB()); },
    async dashboard() { const db = ensureDB(); return dashboardFromUser(currentUserFromDB(db), db); },
    async teamStats() { const db=ensureDB(); return teamStats(currentUserFromDB(db), db); },
    async listNotifications() { const db=ensureDB(), user=currentUserFromDB(db); return notificationItems(user,db); },
    async markNotificationRead(notificationId) { const db=ensureDB(), user=currentUserFromDB(db); if(!user) throw new Error("UNAUTHENTICATED"); user.notificationReadIds=[...(user.notificationReadIds||[]),String(notificationId)].filter((v,i,a)=>a.indexOf(v)===i); write(db); return true; },
    async wallet() { return currentUserFromDB()?.wallet || ""; },
    async saveWallet(address) {
      const db = ensureDB(); const user = currentUserFromDB(db); if (!user) throw new Error("UNAUTHENTICATED");
      if (user.wallet) throw new Error("WALLET_LOCKED");
      user.wallet = address; write(db); return address;
    },
    async changePassword(currentPassword, newPassword) { const db=ensureDB(), user=currentUserFromDB(db); if(!user) throw new Error("UNAUTHENTICATED"); if(!currentPassword||!newPassword||newPassword.length<8) throw new Error("INVALID_PASSWORD"); if(user.passwordHash!==await hash(currentPassword)) throw new Error("INVALID_CREDENTIALS"); user.passwordHash=await hash(newPassword); write(db); return true; },
    async listDeposits() { const user = currentUserFromDB(); if (!user) return []; return ensureDB().deposits.filter(d => d.userId === user.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
    async createDeposit(payload) {
      const db = ensureDB(); const user = currentUserFromDB(db); if (!user) throw new Error("UNAUTHENTICATED");
      const amount = Number(payload.amount || 0); const txid = String(payload.txid || "").trim();
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) throw new Error("INVALID_AMOUNT");
      if (txid.length < 8 || txid.length > 256) throw new Error("INVALID_TXID");
      if (amount < CAPITAL_CONFIG.deposit.minAmount) throw new Error("MIN_DEPOSIT");
      if (!txid) throw new Error("TXID_REQUIRED");
      if (db.deposits.some(d => String(d.txid).toLowerCase() === txid.toLowerCase())) throw new Error("TXID_EXISTS");
      const item = { id: id("DEP"), userId: user.id, email: user.email, name: user.name, amount, txid, currency: CAPITAL_CONFIG.deposit.currency, network: CAPITAL_CONFIG.deposit.network, toAddress: CAPITAL_CONFIG.deposit.address, fromAddress: "", blockNumber: null, confirmations: 0, blockchainStatus: "unverified", verificationStatus: "pending", status: "pending", createdAt: now(), verifiedAt: null, rejectedAt: null, rejectReason: "" };
      db.deposits.push(item); write(db); return item;
    },
    async listWithdrawals() { const user = currentUserFromDB(); if (!user) return []; return ensureDB().withdrawals.filter(w => w.userId === user.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
    async createWithdrawal(payload) {
      const db = ensureDB(); const user = currentUserFromDB(db); if (!user) throw new Error("UNAUTHENTICATED");
      const amount = Number(payload.amount || 0); const wallet = String(payload.address || user.wallet || "").trim();
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) throw new Error("INVALID_AMOUNT");
      const pending = db.withdrawals.filter(w => w.userId === user.id && w.status === "pending").reduce((s,w)=>s+Number(w.amount||0),0);
      const available = Math.max(0, Number(user.available || 0) - pending);
      if (amount < CAPITAL_CONFIG.withdrawal.minAmount) throw new Error("MIN_WITHDRAWAL");
      if (amount > available) throw new Error("INSUFFICIENT_BALANCE");
      if (!wallet) throw new Error("WALLET_REQUIRED");
      if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet)) throw new Error("INVALID_WALLET");
      const item = { id: id("WDR"), userId: user.id, email: user.email, name: user.name, amount, currency: CAPITAL_CONFIG.withdrawal.currency, network: CAPITAL_CONFIG.withdrawal.network, address: wallet, status: "pending", blockchainStatus: "not_sent", createdAt: now(), processedAt: null, txid: "" };
      db.withdrawals.push(item); write(db); return item;
    },
    async listHistory() {
      const user = currentUserFromDB(); if (!user) return [];
      const db = ensureDB();
      const deposits = db.deposits.filter(d=>d.userId===user.id).map(d=>({ id:d.id, type:"deposit", amount:Number(d.amount||0), status:d.status, network:d.network, createdAt:d.createdAt }));
      const withdrawals = db.withdrawals.filter(w=>w.userId===user.id).map(w=>({ id:w.id, type:"withdraw", amount:-Number(w.amount||0), status:w.status, network:w.network, createdAt:w.createdAt }));
      return [...deposits,...withdrawals].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    },
    async activatePlan(amount, vip) {
      const plans = {1:100,2:200,3:300,4:400,5:500};
      if (!Number.isFinite(Number(amount)) || plans[Number(vip)] !== Number(amount)) throw new Error("INVALID_PLAN");
      const db=ensureDB(); const user=currentUserFromDB(db); if(!user) throw new Error("UNAUTHENTICATED");
      if (Number(user.balance||0) < Number(amount)) throw new Error("INSUFFICIENT_BALANCE");
      if (user.activePlan && Number(user.activePlan.vip) !== Number(vip)) throw new Error("PLAN_ACTIVE");
      user.activePlan = { vip:Number(vip), amount:Number(amount), activatedAt:user.activePlan?.activatedAt || now(), status:"active" };
      write(db); return user.activePlan;
    },
    async logout() {
      const db=ensureDB(), token=currentToken();
      db.sessions=db.sessions.filter(s=>s.token!==token); write(db);
      localStorage.removeItem(SESSION); localStorage.removeItem(LEGACY); localStorage.removeItem(EMAIL);
    }
  };

  const backend = {
    async request(path, options={}) {
      const base=String(CAPITAL_CONFIG.apiBaseUrl||"").replace(/\/$/,"");
      const headers={"Content-Type":"application/json",...(options.headers||{})};
      const r=await fetch(base+path,{...options,headers,credentials:"same-origin"});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.code||data.message||"API_ERROR");
      return data.data ?? data;
    },
    me(){return this.request("/api/me")},
    dashboard(){return this.request("/api/dashboard")},
    wallet(){return this.request("/api/profile/wallet")},
    saveWallet(address){return this.request("/api/profile/wallet",{method:"POST",body:JSON.stringify({address})})},
    changePassword(a,b){return this.request("/api/auth/change-password",{method:"POST",body:JSON.stringify({currentPassword:a,newPassword:b})})}, teamStats(){return this.request("/api/profile/team")}, listNotifications(){return this.request("/api/notifications")}, markNotificationRead(id){return this.request("/api/notifications/"+encodeURIComponent(id)+"/read",{method:"POST"})},
    listDeposits(){return this.request("/api/deposits")},
    createDeposit(p){return this.request("/api/deposits",{method:"POST",body:JSON.stringify(p)})},
    listWithdrawals(){return this.request("/api/withdrawals")},
    createWithdrawal(p){return this.request("/api/withdrawals",{method:"POST",body:JSON.stringify(p)})},
    listHistory(){return this.request("/api/history")},
    activatePlan(amount,vip){return this.request("/api/plans/activate",{method:"POST",body:JSON.stringify({amount,vip})})},
    async logout(){await this.request("/api/auth/logout",{method:"POST"}).catch(()=>{});localStorage.removeItem(SESSION);localStorage.removeItem(LEGACY);localStorage.removeItem(EMAIL)}
  };

  window.CapitalAPI = {
    config: CAPITAL_CONFIG,
    get adapter(){ return CAPITAL_CONFIG.mode === "backend" ? backend : mock; },
    async login(email,password){
      if(CAPITAL_CONFIG.mode === "backend"){
        const data=await backend.request("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})});
        localStorage.setItem(LEGACY,"1"); localStorage.setItem(EMAIL,safeEmail(email)); return data?.user||data;
      }
      return mockLogin(email,password);
    },
    async register(payload){
      if(CAPITAL_CONFIG.mode === "backend"){
        const data=await backend.request("/api/auth/register",{method:"POST",body:JSON.stringify(payload)});
        localStorage.setItem(LEGACY,"1"); localStorage.setItem(EMAIL,safeEmail(payload.email)); return data?.user||data;
      }
      return mockRegister(payload);
    },
    async isAuthenticated(){
      if(CAPITAL_CONFIG.mode === "backend"){ try { return !!(await backend.me()); } catch (_) { return false; } }
      return !!sessionUserId();
    },
    async logout(){return this.adapter.logout();},
    async me(){return this.adapter.me();},
    async dashboard(){return this.adapter.dashboard();},
    async wallet(){return this.adapter.wallet();},
    async saveWallet(a){return this.adapter.saveWallet(a);},
    async changePassword(a,b){return this.adapter.changePassword(a,b);}, async teamStats(){return this.adapter.teamStats();}, async listNotifications(){return this.adapter.listNotifications();}, async markNotificationRead(id){return this.adapter.markNotificationRead(id);},
    async listDeposits(){return this.adapter.listDeposits();},
    async createDeposit(p){return this.adapter.createDeposit(p);},
    async listWithdrawals(){return this.adapter.listWithdrawals();},
    async createWithdrawal(p){return this.adapter.createWithdrawal(p);},
    async listHistory(){return this.adapter.listHistory();},
    async activatePlan(amount,vip){return this.adapter.activatePlan(amount,vip);}
  };
})();
