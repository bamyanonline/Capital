function tr(){
  autoTag();
  const key=langCode();
  // Apply direction before translating/reflowing UI so RTL/LTR layout changes atomically.
  document.documentElement.lang=key;
  document.documentElement.dir=["fa","ar","ur"].includes(key)?"rtl":"ltr";
  const l=Object.assign({},lang(),profileTranslations[key]||{});
  document.querySelectorAll("[data-t]").forEach(e=>{
    const k=e.dataset.t;
    if(!e.__capitalSource) e.__capitalSource=e.textContent;
    const translated=l[k]||translatedSource(e.__capitalSource);
    if(translated!==e.__capitalSource) e.textContent=translated;
  });
  translateTextNodes(document.body);
  translateAttributes();
  const sel=document.querySelector("#language"); if(sel) sel.value=key;
  updateDocumentTitle();
}
function setLang(k){
  if(!langs[k]) k="en";
  localStorage.setItem("capitalLang",k);
  // One canonical, synchronous language switch: locale + direction + static UI first.
  document.documentElement.setAttribute("lang",k);
  document.documentElement.setAttribute("dir",["fa","ar","ur"].includes(k)?"rtl":"ltr");
  tr();
  renderVip(window.__capitalUser,window.__capitalDashboard);
  document.dispatchEvent(new CustomEvent("capital:language",{detail:{lang:k}}));
  // Dynamic sections may be rebuilt by async page components. Re-apply the same
  // canonical pass after those components return, without changing the selected language.
  queueMicrotask(()=>{try{tr()}catch(_){}});
  setTimeout(()=>{try{tr()}catch(_){}},0);
  setTimeout(()=>{try{tr()}catch(_){}},100);
}
function selectLang(){const v=document.querySelector("#language")?.value;if(v)setLang(v)}
function extraText(key){
  const map={
    en:{adminReserved:"This email is reserved.",emailExists:"This email is already registered.",minAmount:"Minimum amount is 100 USDT.",inactive:"Activate plan",pending:"Pending",verified:"Verified",rejected:"Rejected",depositType:"Deposit",withdrawType:"Withdrawal",profitType:"Daily profit",completed:"Completed",unverified:"Awaiting verification",walletSaved:"Withdrawal address saved successfully ✓",invalidWallet:"Please enter a valid TRC20 address."},
    fr:{adminReserved:"Cet e-mail est réservé.",emailExists:"Cet e-mail est déjà enregistré.",minAmount:"Le montant minimum est de 100 USDT.",inactive:"Activer le plan",pending:"En attente",verified:"Vérifié",rejected:"Rejeté",depositType:"Dépôt",withdrawType:"Retrait",profitType:"Profit quotidien",completed:"Terminé",unverified:"Vérification en attente",walletSaved:"Adresse de retrait enregistrée ✓",invalidWallet:"Veuillez saisir une adresse TRC20 valide."},
    ru:{adminReserved:"Этот e-mail зарезервирован.",emailExists:"Этот e-mail уже зарегистрирован.",minAmount:"Минимальная сумма — 100 USDT.",inactive:"Активировать план",pending:"В ожидании",verified:"Подтверждено",rejected:"Отклонено",depositType:"Пополнение",withdrawType:"Вывод",profitType:"Дневная прибыль",completed:"Завершено",unverified:"Ожидает проверки",walletSaved:"Адрес вывода сохранён ✓",invalidWallet:"Введите корректный адрес TRC20."},
    ar:{adminReserved:"هذا البريد محجوز.",emailExists:"هذا البريد مسجل بالفعل.",minAmount:"الحد الأدنى هو 100 USDT.",inactive:"تفعيل الخطة",pending:"قيد الانتظار",verified:"تم التحقق",rejected:"مرفوض",depositType:"إيداع",withdrawType:"سحب",profitType:"الربح اليومي",completed:"مكتمل",unverified:"بانتظار التحقق",walletSaved:"تم حفظ عنوان السحب ✓",invalidWallet:"أدخل عنوان TRC20 صالحاً."},
    ur:{adminReserved:"یہ ای میل محفوظ ہے۔",emailExists:"یہ ای میل پہلے سے رجسٹرڈ ہے۔",minAmount:"کم از کم رقم 100 USDT ہے۔",inactive:"پلان فعال کریں",pending:"زیر التوا",verified:"تصدیق شدہ",rejected:"مسترد",depositType:"جمع",withdrawType:"نکلوانا",profitType:"روزانہ منافع",completed:"مکمل",unverified:"تصدیق کا انتظار",walletSaved:"رقم نکلوانے کا پتہ محفوظ ہوگیا ✓",invalidWallet:"درست TRC20 پتہ درج کریں۔"},
    zh:{adminReserved:"此邮箱已保留。",emailExists:"此邮箱已注册。",minAmount:"最低金额为 100 USDT。",inactive:"激活计划",pending:"处理中",verified:"已验证",rejected:"已拒绝",depositType:"充值",withdrawType:"提现",profitType:"每日收益",completed:"已完成",unverified:"等待验证",walletSaved:"提现地址已保存 ✓",invalidWallet:"请输入有效的 TRC20 地址。"},
    fa:{adminReserved:"این ایمیل رزرو شده است.",emailExists:"این ایمیل قبلاً ثبت شده است.",minAmount:"حداقل مبلغ ۱۰۰ USDT است.",inactive:"فعال‌سازی پلن",pending:"در انتظار",verified:"تأیید شده",rejected:"رد شده",depositType:"واریز",withdrawType:"برداشت",profitType:"سود روزانه",completed:"تکمیل شده",unverified:"در انتظار بررسی",walletSaved:"آدرس برداشت با موفقیت ثبت شد ✓",invalidWallet:"لطفاً یک آدرس معتبر TRC20 وارد کنید."}
  };
  return (map[langCode()]||map.fa)[key]||key;
}
function uiError(err){
  const code=String(err?.message||err||"");
  const map={API_ERROR:runtimeText("ارتباط با سرور برقرار نشد. لطفاً سرور را اجرا کنید و دوباره تلاش کنید."),SERVER_ERROR:runtimeText("سرور با خطا مواجه شد. لطفاً دوباره تلاش کنید."),EMAIL_EXISTS:extraText("emailExists"),INVALID_CREDENTIALS:runtimeText("ایمیل یا رمز عبور نادرست است."),PASSWORD_SETUP_REQUIRED:runtimeText("این حساب قدیمی است؛ برای ادامه باید رمز عبور جدید تنظیم شود."),UNAUTHENTICATED:runtimeText("جلسه کاربری معتبر نیست."),MIN_DEPOSIT:runtimeText("حداقل واریز ۱۰۰ USDT است."),TXID_REQUIRED:runtimeText("لطفاً TXID تراکنش را وارد کنید."),TXID_EXISTS:runtimeText("این TXID قبلاً ثبت شده است."),MIN_WITHDRAWAL:runtimeText("حداقل برداشت ۱۰ USDT است."),INSUFFICIENT_BALANCE:runtimeText("موجودی قابل برداشت کافی نیست."),WALLET_REQUIRED:runtimeText("ابتدا آدرس کیف پول برداشت را در Profile ثبت کنید."),WALLET_LOCKED:runtimeText("آدرس کیف پول قبلاً ثبت شده و قابل تغییر نیست."),PLAN_ACTIVE:lang().planActive||extraText("pending")};
  return map[code]||runtimeText("خطایی رخ داد. دوباره تلاش کنید.");
}
function toast(t){const e=document.querySelector(".toast");if(!e)return;e.textContent=t;e.classList.add("show");clearTimeout(window.__capitalToast);window.__capitalToast=setTimeout(()=>e.classList.remove("show"),2200)}
function currentEmail(){return (localStorage.getItem("capitalEmail")||"").trim().toLowerCase()}
function findUser(email){
  // Compatibility facade. New code uses CapitalAPI; this is kept for old integrations.
  try{const db=JSON.parse(localStorage.getItem("capitalMockDB")||"null");return db?.users?.find(u=>String(u.email||"").toLowerCase()===String(email||"").toLowerCase())||null}catch(_){return null}
}
function generateReferralId(users){const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let id;do{id="CAP-"+Array.from({length:8},()=>alphabet[Math.floor(Math.random()*alphabet.length)]).join("")}while((users||[]).some(u=>u.referralId===id));return id}
async function login(e){
  e.preventDefault();
  const form=e.target, email=(form.querySelector('input[type="email"]')?.value||"").trim().toLowerCase(), password=form.querySelector('input[type="password"]')?.value||"";
  if(!email||!password)return;
  try{const user=await CapitalAPI.login(email,password);localStorage.setItem("capitalEmail",email);window.__capitalUser=user;location.href="assets.html"}
  catch(err){toast(uiError(err))}
}
async function register(e){
  e.preventDefault();
  const a=document.querySelector("#password")?.value||"", b=document.querySelector("#confirm")?.value||"";
  if(a!==b){toast(lang().confirm+" ❌");return}
  const securityAnswer=Number(document.querySelector("#registerSecurityA")?.value);
  if(!Number.isFinite(securityAnswer)||securityAnswer!==registerSecurityN+registerSecurityM){toast(lang().security+" ❌");newRegisterSecurity();return}
  const inputs=e.target.querySelectorAll("input"), name=(inputs[0]?.value||"").trim(), family=(inputs[1]?.value||"").trim(), email=(inputs[2]?.value||"").trim().toLowerCase();
  if(email==="admin"){toast(extraText("adminReserved"));return}
  try{
    const referralFrom=(new URLSearchParams(location.search).get("ref")||"").trim();
    const user=await CapitalAPI.register({name,family,email,password:a,referredBy:referralFrom});
    localStorage.setItem("capitalEmail",email);window.__capitalUser=user;location.href="assets.html";
  }catch(err){toast(uiError(err))}
}
async function logout(){try{await CapitalAPI.logout()}finally{location.href="index.html"}}
function copyAddress(){const a=document.querySelector("#depositAddress")?.value||CapitalAPI.config.deposit.address;navigator.clipboard?.writeText(a);toast(lang().copy+" ✓")}
function activeVip(user){return Number(user?.activePlan?.vip||0)}
async function activatePlan(amount,vip){
  try{await CapitalAPI.activatePlan(amount,vip);await refreshUserUI();toast(lang().activePlan+" ✓")}
  catch(err){toast(uiError(err))}
}
async function currentUser(){try{return await CapitalAPI.me()}catch(_){return null}}
async function refreshUserUI(){
  const [user,dash]=await Promise.all([CapitalAPI.me(),CapitalAPI.dashboard()]);
  window.__capitalUser=user;window.__capitalDashboard=dash;
  renderVip(user,dash);renderDashboard(dash,user);renderProfile(user,dash);renderProfileReferral(user);await renderTeamStats();await refreshNotificationBadge();return {user,dash};
}
function localeForLanguage(){return ({fa:"fa-IR",ar:"ar-SA",ur:"ur-PK",en:"en-US",fr:"fr-FR",ru:"ru-RU",zh:"zh-CN"}[langCode()]||"en-US")}
function money(v){return Number(v||0).toFixed(2)+" USDT"}
function renderDashboard(d){if(!d)return;const map={invested:d.investedCapital,daily:d.dailyProfit,team:d.teamProfit,total:d.totalProfit,available:d.available,withdrawals:d.totalWithdrawals,referralReward:d.referralReward??d.referralIncome??0,otherRewards:d.otherRewards??0};Object.entries(map).forEach(([k,v])=>document.querySelectorAll(`[data-dashboard="${k}"]`).forEach(e=>e.textContent=money(v)))}
function renderVip(user,dash){
  const vip=activeVip(user), email=user?.email||currentEmail()||"—", deposit=Number(dash?.balance ?? user?.balance ?? 0);
  document.querySelectorAll("[data-user-email]").forEach(e=>e.textContent=email);
  document.querySelectorAll("[data-user-deposit]").forEach(e=>e.textContent=money(deposit));
  document.querySelectorAll("[data-vip]").forEach(e=>{const v=String(e.dataset.vip),isActive=v===String(vip);e.classList.toggle("active",isActive);const b=e.querySelector("[data-plan-btn]");if(b){b.textContent=isActive?lang().activePlan:extraText("inactive");b.disabled=!!(vip&& !isActive)}});
  document.querySelectorAll("[data-user-vip]").forEach(e=>e.textContent=vip?"VIP "+vip:lang().vip0);
}
function renderProfile(user,dash){
  if(!user)return;
  const full=[user.name,user.family].filter(Boolean).join(" ")||"—";
  document.querySelectorAll("[data-profile-name]").forEach(e=>e.textContent=full);
  document.querySelectorAll("[data-user-email]").forEach(e=>e.textContent=user.email||"—");
  document.querySelectorAll("[data-profile-status]").forEach(e=>e.textContent=user.status||"active");
  document.querySelectorAll("[data-profile-created]").forEach(e=>e.textContent=user.createdAt?new Date(user.createdAt).toISOString().slice(0,10):"—");document.querySelectorAll("[data-profile-last-login]").forEach(e=>e.textContent=user.lastLoginAt?new Date(user.lastLoginAt).toLocaleString():"—");
  const cards={daily:user?.dailyProfit||0,team:user?.teamProfit||0,total:user?.totalProfit||0,available:dash?.available||0,withdrawals:user?.totalWithdrawals||0};Object.entries(cards).forEach(([k,v])=>document.querySelectorAll(`[data-profile-stat="${k}"]`).forEach(e=>e.textContent=money(v)));
  document.querySelectorAll("[data-user-vip]").forEach(e=>e.textContent=activeVip(user)?"VIP "+activeVip(user):lang().vip0);
}
async function renderTeamStats(){const box=document.querySelector("[data-profile-direct-members]");if(!box)return;try{const x=await CapitalAPI.teamStats();document.querySelectorAll("[data-profile-direct-members]").forEach(e=>e.textContent=Number(x?.directMembers||0));document.querySelectorAll("[data-profile-team-members]").forEach(e=>e.textContent=Number(x?.teamMembers||0));}catch(_){}}
async function refreshNotificationBadge(){const badge=document.querySelector("#notificationBadge");if(!badge)return;try{const rows=await CapitalAPI.listNotifications();const n=rows.filter(x=>!x.read).length;badge.textContent=n>99?"99+":String(n);badge.hidden=n===0;}catch(_){badge.hidden=true}}
async function renderNotifications(){const box=document.querySelector("#notificationsList");if(!box)return;const t=notificationTranslations[langCode()]||notificationTranslations.fa;let rows=[];let source="backend";try{rows=await CapitalAPI.listNotifications()}catch(err){source="fallback";try{const raw=JSON.parse(localStorage.getItem("capitalMockDB")||"null");const email=String(localStorage.getItem("capitalEmail")||"").toLowerCase();const user=raw?.users?.find(u=>String(u.email||"").toLowerCase()===email);if(user){const read=new Set(user.notificationReadIds||[]);const withdrawals=(raw.withdrawals||[]).filter(w=>w.userId===user.id&&["completed","approved","success","rejected"].includes(String(w.status||"").toLowerCase())).map(w=>{const st=String(w.status||"").toLowerCase(),id="withdrawal:"+w.id+":"+st;return{id,kind:"withdrawal",status:st==="rejected"?"rejected":"success",title:st==="rejected"?t.withdrawRejected:t.withdrawSuccess,body:st==="rejected"?(w.rejectReason||"درخواست برداشت شما توسط مدیریت رد شده است."):"برداشت "+Number(w.amount||0).toFixed(2)+" USDT با موفقیت پردازش شد.",createdAt:w.processedAt||w.createdAt,read:read.has(id)}});const announcements=(raw.adminAnnouncements||[]).filter(x=>!x.userId||x.userId===user.id).map(x=>{const id="announcement:"+x.id;return{id,kind:"admin",status:"info",title:x.title||t.adminNotice,body:x.body||"",createdAt:x.createdAt||new Date().toISOString(),read:read.has(id)}});rows=[...withdrawals,...announcements].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));}}catch(_){rows=[]}if(!rows.length){box.innerHTML=`<div class="empty-state">${source==="fallback"?runtimeText("اتصال اعلان‌ها به سرور برقرار نشد. در نسخه محلی، ابتدا سرور را اجرا کنید."):t.noNotifications}</div>`;return;}box.innerHTML=rows.map(x=>{const title=x.kind==='admin'?(x.title||t.adminNotice):(x.status==='rejected'?t.withdrawRejected:t.withdrawSuccess);return `<article class="notification-item ${x.read?'read':'unread'}"><div class="notification-icon ${x.status==='rejected'?'rejected':''}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4a7 7 0 0 0-7 7v3.2L3.5 17h17L19 14.2V11a7 7 0 0 0-7-7Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 20h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div><div class="notification-body"><div class="notification-head"><strong>${escapeHtml(title)}</strong>${x.read?'':'<span class="notification-dot"></span>'}</div><p>${escapeHtml(x.body||'')}</p><small>${new Date(x.createdAt).toLocaleString(localeForLanguage())}</small>${x.read?'':`<button type="button" class="notification-read" onclick="markNotificationRead('${String(x.id).replace(/'/g,"\'")}')">${t.markRead}</button>`}</div></article>`}).join('')}
}
async function markNotificationRead(id){try{await CapitalAPI.markNotificationRead(id);await renderNotifications();await refreshNotificationBadge();}catch(err){toast(uiError(err))}}
function currentReferralId(user){return user?.referralId||"—"}
function renderProfileReferral(user){document.querySelectorAll("[data-user-referral]").forEach(e=>e.textContent=currentReferralId(user||window.__capitalUser))}
function invitationUrl(){const id=currentReferralId(window.__capitalUser);if(!id||id==="—")return"";const u=new URL("register.html",location.href);u.searchParams.set("ref",id);return u.href}
async function copyInviteLink(){const url=invitationUrl();if(!url)return;try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(url);else{const ta=document.createElement("textarea");ta.value=url;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}toast((profileTranslations[langCode()]||profileTranslations.fa).copied+" ✓")}catch(_){toast(url)}}
function walletStorageKey(){return "capitalWithdrawalAddress_"+(currentEmail()||"default")}
async function loadProfileWallet(){const input=document.querySelector("#profileWalletAddress"),btn=document.querySelector("#saveProfileWallet"),status=document.querySelector("#profileWalletStatus");if(!input)return;try{const saved=await CapitalAPI.wallet();if(saved){input.value=saved;input.readOnly=true;input.classList.add("locked-address");if(btn){btn.disabled=true;btn.textContent=lang().addressSaved||runtimeText("آدرس ثبت شده است")}if(status)status.textContent=lang().permanentVerified||runtimeText("دائمی / تأییدشده")}}catch(_){} }
async function saveProfileWallet(){const input=document.querySelector("#profileWalletAddress");if(!input)return;try{const current=await CapitalAPI.wallet();if(current){await loadProfileWallet();return}const a=input.value.trim();if(!a)return toast(runtimeText("لطفاً آدرس کیف پول TRC20 را وارد کنید."));if(!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a))return toast(extraText("invalidWallet"));if(!confirm(dynamicText("walletConfirm")))return;await CapitalAPI.saveWallet(a);await loadProfileWallet();toast(extraText("walletSaved"))}catch(err){toast(uiError(err))}}
async function changeProfilePassword(){const c=document.querySelector("#currentPassword")?.value||"",n=document.querySelector("#newPassword")?.value||"",r=document.querySelector("#confirmNewPassword")?.value||"";if(n.length<8)return toast(dynamicText("newPasswordMin"));if(n!==r)return toast(dynamicText("passwordMismatch"));try{await CapitalAPI.changePassword(c,n);["#currentPassword","#newPassword","#confirmNewPassword"].forEach(x=>{const e=document.querySelector(x);if(e)e.value=""});toast(runtimeText("رمز عبور با موفقیت تغییر کرد ✓"))}catch(err){toast(uiError(err))}}
function newSecurity(){securityN=Math.floor(Math.random()*8)+2;securityM=Math.floor(Math.random()*8)+2;const q=document.querySelector("#securityQ");if(q)q.textContent=`${securityN} + ${securityM} = ?`}
let securityN=0,securityM=0,registerSecurityN=0,registerSecurityM=0;
function newRegisterSecurity(){registerSecurityN=Math.floor(Math.random()*9)+1;registerSecurityM=Math.floor(Math.random()*9)+1;const q=document.querySelector("#registerSecurityQ");if(q)q.textContent=`${registerSecurityN} + ${registerSecurityM} = ?`}
function setupRegisterSecurity(){
  const card=document.querySelector("#registerSecurityCard"), q=document.querySelector("#registerSecurityQ"), a=document.querySelector("#registerSecurityA");
  if(!card||!q||!a)return;
  const showAnswer=()=>{card.classList.add("is-answering");requestAnimationFrame(()=>a.focus())};
  q.addEventListener("click",showAnswer);
  a.addEventListener("blur",()=>{if(!a.value.trim())card.classList.remove("is-answering")});
}
function forgotPassword(e){e.preventDefault();toast(runtimeText("بازیابی رمز عبور پس از اتصال Backend فعال می‌شود."));newSecurity()}
function startSession(){let timer;const reset=()=>{clearTimeout(timer);timer=setTimeout(async()=>{if(await CapitalAPI.isAuthenticated()){await CapitalAPI.logout();if(!location.pathname.endsWith("index.html")&&location.pathname!=="/")location.href="index.html"}},CAPITAL_CONFIG.sessionMinutes*60*1000)};["click","touchstart","mousemove","keydown","scroll"].forEach(x=>addEventListener(x,reset,{passive:true}));reset()}
async function submitDeposit(){
  const amount=Number(document.querySelector("#depositAmount")?.value||0), txid=(document.querySelector("#depositTxid")?.value||"").trim();
  if(!amount||amount<CapitalAPI.config.deposit.minAmount)return toast(runtimeText("لطفاً مبلغ واریز را حداقل ۱۰۰ USDT و به‌صورت صحیح وارد کنید."));
  if(!txid)return toast(extraText("pending")+" — "+extraText("unverified"));
  try{await CapitalAPI.createDeposit({amount,txid,network:CapitalAPI.config.deposit.network,currency:CapitalAPI.config.deposit.currency,toAddress:CapitalAPI.config.deposit.address});toast(runtimeText("درخواست واریز ثبت شد و تا تأیید مدیر به موجودی اضافه نمی‌شود ✓"));document.querySelector("#depositAmount").value="";document.querySelector("#depositTxid").value="";await renderHistory()}catch(err){toast(uiError(err))}
}
function withdrawRulesForVip(vip){const rules={1:10,2:20,3:30,4:40,5:50};return rules[Number(vip)]||0}
function updateWithdrawSummary(){const amount=Math.max(0,Number(document.querySelector("#withdrawAmount")?.value||0)),fee=amount*0.10,receive=Math.max(0,amount-fee);const a=document.querySelector("#summaryAmount"),f=document.querySelector("#summaryFee"),r=document.querySelector("#summaryReceive");if(a)a.textContent=money(amount);if(f)f.textContent=money(fee);if(r)r.textContent=money(receive)}
async function refreshWithdrawUI(){
  const [d,user]=await Promise.all([CapitalAPI.dashboard(),CapitalAPI.me()]);
  const el=document.querySelector("#withdrawableBalance");if(el)el.textContent=money(d?.available||0);
  const vip=activeVip(user),min=withdrawRulesForVip(vip),amount=document.querySelector("#withdrawAmount"),minEl=document.querySelector("#withdrawMinAmount"),note=document.querySelector("#withdrawVipNote");
  if(amount){amount.min=min>0?String(min):"0";amount.setAttribute("data-vip-min",String(min))}
  if(minEl)minEl.textContent=min>0?("VIP "+vip+" — "+money(min)):"—";
  if(note)note.textContent=min>0?dynamicText("minWithdrawNote",vip):dynamicText("noVip");
  const wallet=await CapitalAPI.wallet();const addr=document.querySelector("#withdrawAddress");if(addr){addr.value=wallet||"";addr.readOnly=true;if(wallet)addr.classList.add("locked-address")}
  updateWithdrawSummary()
}
async function setMaxWithdraw(){const d=await CapitalAPI.dashboard();const amount=document.querySelector("#withdrawAmount");if(amount)amount.value=Number(d?.available||0).toFixed(2);updateWithdrawSummary()}
async function submitWithdrawal(){
  const amount=Number(document.querySelector("#withdrawAmount")?.value||0), wallet=await CapitalAPI.wallet(), user=await CapitalAPI.me(), vip=activeVip(user), min=withdrawRulesForVip(vip);
  if(!vip)return toast(dynamicText("noVip"));
  if(!amount||amount<min)return toast(dynamicText("minVip",vip,min));
  if(!wallet)return toast(runtimeText("لطفاً ابتدا آدرس کیف پول برداشت را در Profile ثبت کنید."));
  try{await CapitalAPI.createWithdrawal({amount,address:wallet,network:CapitalAPI.config.withdrawal.network,currency:CapitalAPI.config.withdrawal.currency});toast(runtimeText("درخواست برداشت ثبت شد و تا تأیید مدیر از موجودی کسر نمی‌شود ✓"));document.querySelector("#withdrawAmount").value="";await refreshWithdrawUI();await refreshUserUI();await renderHistory()}catch(err){toast(uiError(err))}
}
const DEPOSIT_SETTINGS_KEY="capitalDepositSettings";
function getFrontendDepositSettings(){
  const fallback={network:CapitalAPI.config?.deposit?.network||"TRC20",address:CapitalAPI.config?.deposit?.address||"",qrData:""};
  try{return {...fallback,...JSON.parse(localStorage.getItem(DEPOSIT_SETTINGS_KEY)||"{}")}}catch(_){return fallback}
}
function setupDeposit(){
  const a=document.querySelector("#depositAddress"); if(!a)return;
  const settings=getFrontendDepositSettings();
  const n=document.querySelector("#depositNetwork");
  const network=settings.network||"TRC20";
  if(n){
    n.innerHTML="";
    const option=document.createElement("option");
    option.value=network; option.textContent=network+" — USDT"; n.appendChild(option); n.value=network;
  }
  a.value=settings.address||"";
  const qr=document.querySelector("#depositQrImage");
  if(qr){
    qr.src=settings.qrData||"assets/deposit-qr.jpg";
    qr.alt="USDT "+network+" Deposit QR Code";
  }
  document.querySelectorAll("[data-deposit-network]").forEach(e=>e.textContent=network);
  ["[data-t='depositIntro']","[data-t='networkWarning']"].forEach(sel=>document.querySelectorAll(sel).forEach(e=>{
    e.textContent=e.textContent.replace(/TRC20|ERC20|BEP20|Polygon|Solana/gi,network);
  }));
}
window.addEventListener("storage",e=>{if(e.key===DEPOSIT_SETTINGS_KEY)setupDeposit()});
function setupWithdraw(){const amount=document.querySelector("#withdrawAmount");if(!amount)return;amount.addEventListener("input",updateWithdrawSummary);refreshWithdrawUI()}
async function renderHistory(){const list=document.querySelector(".history-list");if(!list)return;const items=await CapitalAPI.listHistory();if(!items.length){list.innerHTML='<div class="history-empty" data-t="historyEmpty">'+(lang().historyEmpty||"No transactions yet")+"</div>";return}const icon={deposit:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"',withdraw:'<path d="M12 20V9M7.5 13.5 12 9l4.5 4.5M5 5h14"',profit:'<path d="M5 16l4-4 3 3 7-8M15 7h4v4"'};list.innerHTML=items.map(i=>{const type=i.type==='deposit'?'deposit':i.type==='withdraw'?'withdraw':'profit',positive=i.amount>=0,status=i.status==='pending'?extraText('pending'):i.status==='verified'||i.status==='completed'?extraText('verified'):i.status==='rejected'?extraText('rejected'):i.status;return `<article class="history-item" data-type="${type}"><div class="history-icon ${type}-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${icon[type]}</svg></div><div class="history-info"><b>${type==='deposit'?extraText('depositType'):type==='withdraw'?extraText('withdrawType'):extraText('profitType')}</b><small>${i.network||''} · ${new Date(i.createdAt).toLocaleDateString(localeForLanguage())} · ${status}</small></div><strong class="history-amount ${positive?'pos':'neg'}">${positive?'+':''}${Math.abs(Number(i.amount||0)).toFixed(2)} USDT</strong></article>`}).join("")}
function bindHistoryFilters(){document.querySelectorAll('.history-filter-btn').forEach(btn=>btn.addEventListener('click',function(){document.querySelectorAll('.history-filter-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');const type=this.dataset.filter;document.querySelectorAll('.history-item').forEach(item=>item.classList.toggle('is-hidden',type!=='all'&&item.dataset.type!==type))}))}
document.addEventListener("capital:language",()=>{
  // Every dynamic renderer reads langCode() at render time, so no stale-language
  // snapshot can survive a language switch.
  if(document.querySelector(".history-list"))renderHistory().finally(()=>tr());
  if(document.querySelector("#notificationsList"))renderNotifications().finally(()=>tr());
  if(document.querySelector("#profileWalletAddress"))loadProfileWallet().finally(()=>tr());
  if(document.querySelector("#withdrawAmount"))refreshWithdrawUI().finally(()=>tr());
  if(document.querySelector("[data-dashboard]"))refreshUserUI().finally(()=>tr());
  refreshNotificationBadge();
});
if(!localStorage.getItem("capitalLang")) localStorage.setItem("capitalLang","en");

async function init(){
  const p=location.pathname.split("/").pop()||"assets.html";
  const publicPages=["index.html","register.html",""];
  const params=new URLSearchParams(location.search);
  const previewRequested=params.get("preview")==="1";
  if(previewRequested) sessionStorage.setItem("capitalPreviewMode","1");
  const previewMode=sessionStorage.getItem("capitalPreviewMode")==="1";
  if(!publicPages.includes(p)&&!previewMode&&!(await CapitalAPI.isAuthenticated())){location.replace("index.html");return}
  tr();newSecurity();newRegisterSecurity();setupRegisterSecurity();
  if(!previewMode) startSession();
  // Navigation active-state is owned by the shared layout shell.
  // Keep this defensive call for pages that are initialized asynchronously.
  window.CapitalLayout?.setActiveNav?.();
  if(await CapitalAPI.isAuthenticated()) await refreshUserUI();
  await loadProfileWallet();
  setupDeposit();
  setupWithdraw();
  await renderHistory();
  await renderNotifications();
  await refreshNotificationBadge();
  bindHistoryFilters();
}
window.getCapitalUsers=()=>[];
window.syncCurrentUserToRecord=()=>Promise.resolve();
window.syncCurrentUserFromRecord=()=>Promise.resolve();
document.addEventListener("click",function(e){
  const el=e.target.closest("[data-action]");
  if(!el) return;
  const name=el.getAttribute("data-action");
  const fn=window[name];
  if(typeof fn!=="function") return;
  if(el.tagName==="A" || el.tagName==="BUTTON") e.preventDefault();
  const raw=el.getAttribute("data-action-args")||"";
  const args=raw?raw.split(",").map(v=>{const t=v.trim(); if(/^[-+]?\d+(?:\.\d+)?$/.test(t)) return Number(t); return t.replace(/^(["\'])(.*)\1$/,"$2");}):[];
  try{ const result=fn.apply(el,args); if(result&&typeof result.catch==="function") result.catch(err=>{ if(typeof toast==="function") toast(uiError(err)); }); }catch(err){ if(typeof toast==="function") toast(uiError(err)); }
},{passive:false});

document.addEventListener("DOMContentLoaded",init);

(function(){
  function formatUSDTText(text){if(!text)return text;return text.replace(/\$(\d[\d,]*(?:\.\d+)?)/g,'$1 USDT')}
  function normalizeDates(){document.querySelectorAll('[data-date]').forEach(el=>{const raw=(el.getAttribute('data-date')||el.textContent||'').trim();const m=raw.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);if(m)el.textContent=m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0')})}
  window.addEventListener('load',function(){normalizeDates();document.querySelectorAll('.value,.profit,[data-money],.money').forEach(el=>{if(el.children.length===0)el.textContent=formatUSDTText(el.textContent)})});
})();


/* CAPITAL v7 — Assets financial action sizing.
   Match both financial buttons to the actual height of the dashboard cards
   above, including responsive text wrapping. */
(function(){
  function syncAssetsFinancialActionHeight(){
    if(!document.querySelector(".assets-financial-actions")) return;
    const cards=[...document.querySelectorAll(".grid > .card")];
    if(!cards.length) return;
    const height=Math.max(...cards.map(card=>card.getBoundingClientRect().height));
    if(height>0) document.documentElement.style.setProperty("--assets-financial-card-height",height+"px");
  }
  function bindAssetsFinancialSizing(){
    syncAssetsFinancialActionHeight();
    if(!window.ResizeObserver) return;
    const grid=document.querySelector(".grid");
    if(!grid || grid.dataset.assetsFinancialResizeBound==="1") return;
    grid.dataset.assetsFinancialResizeBound="1";
    const observer=new ResizeObserver(syncAssetsFinancialActionHeight);
    observer.observe(grid);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bindAssetsFinancialSizing);
  else bindAssetsFinancialSizing();
  window.addEventListener("resize",syncAssetsFinancialActionHeight,{passive:true});
})();

/* Capital shared button click/tap animation: press + contextual ripple. */
(function(){
  const selector='.btn,.action,.tool,.mini-card,.profile-invite button,.bottom a,.links a,button[type="button"],button[type="submit"],button[type="reset"]';
  function ripple(e){
    const el=e.currentTarget;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const old=el.querySelectorAll('.capital-ripple');
    old.forEach(x=>x.remove());
    const rect=el.getBoundingClientRect();
    const touch=e.touches&&e.touches[0];
    const x=touch?touch.clientX:e.clientX;
    const y=touch?touch.clientY:e.clientY;
    const px=(Number.isFinite(x)?x-rect.left:rect.width/2);
    const py=(Number.isFinite(y)?y-rect.top:rect.height/2);
    const r=document.createElement('span');
    r.className='capital-ripple';
    r.style.left=px+'px';
    r.style.top=py+'px';
    const size=Math.max(rect.width,rect.height)*1.9;
    r.style.width=size+'px';
    r.style.height=size+'px';
    el.appendChild(r);
    r.addEventListener('animationend',()=>r.remove(),{once:true});
  }
  function bind(){
    document.querySelectorAll(selector).forEach(el=>{
      if(el.dataset.capitalRippleBound==='1')return;
      el.dataset.capitalRippleBound='1';
      el.addEventListener('pointerdown',ripple,{passive:true});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();

/* CAPITAL v2 — English-digit invariant across every language. */
(function(){
  const normalize=v=>String(v??'').replace(/[۰-۹]/g,d=>'0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[٠-٩]/g,d=>'0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  const scan=root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),a=[];while(w.nextNode())a.push(w.currentNode);a.forEach(n=>{if(n.parentElement&&!/^(SCRIPT|STYLE)$/i.test(n.parentElement.tagName))n.nodeValue=normalize(n.nodeValue)});document.querySelectorAll('input,textarea,option').forEach(e=>{if('value' in e)e.value=normalize(e.value);if(e.textContent)e.textContent=normalize(e.textContent)})};
  window.addEventListener('load',()=>scan(document.body));
  document.addEventListener('capital:language',()=>requestAnimationFrame(()=>scan(document.body)));
  new MutationObserver(()=>scan(document.body)).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
