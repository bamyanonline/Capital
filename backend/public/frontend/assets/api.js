/* CAPITAL Production API adapter. Financial state never lives in browser storage. */
window.CAPITAL_CONFIG = window.CAPITAL_CONFIG || { mode: 'backend', apiBaseUrl: '', sessionMinutes: 30, deposit: {network:'TRC20',currency:'USDT',minAmount:100}, withdrawal:{network:'TRC20',currency:'USDT',fee:0.10,minimumRemaining:20,window:{start:480,end:960}} };
(function(){
  'use strict';
  const safeEmail=v=>String(v||'').trim().toLowerCase();
  async function request(path, options={}){
    const base=String(CAPITAL_CONFIG.apiBaseUrl||'').replace(/\/$/,'');
    const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(options.headers||{})};
    const r=await fetch(base+path,{...options,headers,credentials:'same-origin',cache:'no-store'});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.code||data.message||'API_ERROR');
    return data.data ?? data;
  }
  const backend={
    request,
    config(){return request('/api/config')}, me(){return request('/api/me')}, dashboard(){return request('/api/dashboard')}, wallet(){return request('/api/profile/wallet')},
    saveWallet(address){return request('/api/profile/wallet',{method:'POST',body:JSON.stringify({address})})},
    changePassword(a,b){return request('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword:a,newPassword:b})})},
    teamStats(){return request('/api/profile/team')}, listNotifications(){return request('/api/notifications')}, markNotificationRead(id){return request('/api/notifications/'+encodeURIComponent(id)+'/read',{method:'POST'})},
    listDeposits(){return request('/api/deposits')}, createDeposit(p){return request('/api/deposits',{method:'POST',headers:{'Idempotency-Key':p.idempotencyKey||crypto.randomUUID()},body:JSON.stringify(p)})},
    listWithdrawals(){return request('/api/withdrawals')}, createWithdrawal(p){return request('/api/withdrawals',{method:'POST',headers:{'Idempotency-Key':p.idempotencyKey||crypto.randomUUID()},body:JSON.stringify(p)})},
    listHistory(){return request('/api/history')},
    requestPasswordReset(email){return request('/api/auth/request-reset',{method:'POST',body:JSON.stringify({email:safeEmail(email)})})}, resetPassword(token,newPassword){return request('/api/auth/reset-password',{method:'POST',body:JSON.stringify({token,newPassword})})},
    logout(){return request('/api/auth/logout',{method:'POST'}).catch(()=>true)}
  };
  window.CapitalAPI={config:CAPITAL_CONFIG,adapter:backend,...backend,login(email,password){return request('/api/auth/login',{method:'POST',body:JSON.stringify({email:safeEmail(email),password})}).then(x=>x.user||x)},register(payload){return request('/api/auth/register',{method:'POST',body:JSON.stringify({...payload,email:safeEmail(payload.email)})}).then(x=>x.user||x)},isAuthenticated(){return backend.me().then(()=>true).catch(()=>false)}};
})();
