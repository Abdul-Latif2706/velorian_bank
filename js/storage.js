/* Velorian Bank — centralized browser state.
   Front-end prototype only. Do not use localStorage for real banking/security. */
const VB_STORAGE_KEY = "velorian_bank_state_v5";
const VB_SESSION_KEY = "velorian_bank_session_v2";
const ACCOUNT_PREFIX = "1092";
const CURRENCY = "USD";
const VB_CURRENCIES = {
  USD: { code: "USD", name: "US Dollar", symbol: "$", locale: "en-US" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", locale: "en-GB" },
  EUR: { code: "EUR", name: "Euro", symbol: "€", locale: "de-DE" }
};
const TRANSFER_DAILY_LIMIT = 25000;

function vbSeedState() {
  return {
    version: 5,
    bank: { name: "Velorian Bank", currency: CURRENCY, accountPrefix: ACCOUNT_PREFIX, supportedCurrencies: ["USD","GBP","EUR"], rates: { USD: { USD: 1, GBP: 0.78, EUR: 0.85 }, GBP: { USD: 1.28, GBP: 1, EUR: 1.09 }, EUR: { USD: 1.18, GBP: 0.92, EUR: 1 } } },
    admin: { email: "admin@velorian.test", password: "Admin@123" },
    clients: [], transactions: [], audit: [], notifications: []
  };
}
function vbGetState() {
  let state;
  try { state = JSON.parse(localStorage.getItem(VB_STORAGE_KEY) || "null"); } catch { state = null; }
  if (!state || typeof state !== "object") { state = vbSeedState(); localStorage.setItem(VB_STORAGE_KEY, JSON.stringify(state)); }
  // Normalize state before touching nested collections. This prevents older browser state from breaking the client portal.
  state.bank ||= { name: "Velorian Bank", currency: CURRENCY, accountPrefix: ACCOUNT_PREFIX };
  state.clients ||= []; state.transactions ||= []; state.audit ||= []; state.notifications ||= [];
  state.bank.supportedCurrencies ||= ["USD","GBP","EUR"];
  state.bank.rates ||= { USD: { USD: 1, GBP: 0.78, EUR: 0.85 }, GBP: { USD: 1.28, GBP: 1, EUR: 1.09 }, EUR: { USD: 1.18, GBP: 0.92, EUR: 1 } };
  state.clients.forEach(c => { c.currency ||= CURRENCY; c.forcePasswordChange ||= false; });
  state.transactions.forEach(t => { const c=state.clients.find(x=>x.id===t.clientId); t.currency ||= c?.currency || CURRENCY; });
  if (!VB_CURRENCIES[state.bank.currency]) state.bank.currency = CURRENCY;
  return state;
}
function vbSaveState(state) { localStorage.setItem(VB_STORAGE_KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent("velorian:statechange")); }
function vbResetBankData() { const s=vbSeedState(); localStorage.setItem(VB_STORAGE_KEY, JSON.stringify(s)); window.dispatchEvent(new CustomEvent("velorian:statechange")); return s; }
function vbGetSession() { try { return JSON.parse(sessionStorage.getItem(VB_SESSION_KEY)||"null"); } catch { return null; } }
function vbSetSession(role, clientId=null, accountNumber=null) { sessionStorage.setItem(VB_SESSION_KEY, JSON.stringify({role,clientId,accountNumber,createdAt:Date.now()})); }
function vbClearSession() { sessionStorage.removeItem(VB_SESSION_KEY); }
function vbFindClient(id) { return vbGetState().clients.find(c=>c.id===id); }
function vbMakeId(prefix) { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`.toUpperCase(); }
function vbGenerateAccountNumber() { const s=vbGetState(); let n; do { n=ACCOUNT_PREFIX+Math.floor(100000+Math.random()*900000); } while(s.clients.some(c=>c.accountNumber===n)); return n; }
function vbGetCurrency(code=CURRENCY) { return VB_CURRENCIES[code] || VB_CURRENCIES[CURRENCY]; }
function vbGetClientCurrency(clientOrId) {
  const c = typeof clientOrId === "string" ? vbFindClient(clientOrId) : clientOrId;
  return vbGetCurrency(c?.currency || CURRENCY);
}
function vbCurrencySymbol(code=CURRENCY) { return vbGetCurrency(code).symbol; }
function vbFormatMoney(v, code=CURRENCY) {
  const currency = vbGetCurrency(code);
  return new Intl.NumberFormat(currency.locale,{style:"currency",currency:currency.code}).format(Number(v||0));
}
function vbSetCurrency(code) {
  if (!VB_CURRENCIES[code]) throw new Error("Unsupported currency.");
  const s=vbGetState(); s.bank.currency=code; vbSaveState(s); return s;
}
function vbSetExchangeRate(from,to,rate) {
  if (!VB_CURRENCIES[from] || !VB_CURRENCIES[to]) throw new Error("Unsupported currency.");
  const value=Number(rate); if(!Number.isFinite(value)||value<=0) throw new Error("Exchange rate must be greater than zero.");
  const s=vbGetState(); s.bank.rates[from] ||= {}; s.bank.rates[from][to]=value; if(from===to) s.bank.rates[from][to]=1;
  s.audit.unshift({id:vbMakeId("AUD"),action:"Exchange rate updated",details:`${from} → ${to} = ${value}`,actor:s.admin?.name||"Administrator",timestamp:new Date().toISOString()}); vbSaveState(s); return s;
}
function vbGetRate(from,to) { if(from===to)return 1; return Number(vbGetState().bank.rates?.[from]?.[to] || 0); }
function vbRenderCurrencyUI(root=document) {
  const c = vbGetCurrency();
  root.querySelectorAll("[data-currency-symbol]").forEach(el => el.textContent = c.symbol);
  root.querySelectorAll("[data-currency-code]").forEach(el => el.textContent = c.code);
  root.querySelectorAll("[data-currency-name]").forEach(el => el.textContent = c.name);
}
function vbFormatDate(iso) { return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(iso)); }
function vbShortDate(iso) { return new Intl.DateTimeFormat("en-US",{month:"short",day:"numeric",year:"numeric"}).format(new Date(iso)); }
function vbRelativeDate(iso) { const d=Date.now()-new Date(iso).getTime(), m=Math.floor(d/60000); if(m<1)return "Just now"; if(m<60)return `${m}m ago`; const h=Math.floor(m/60); if(h<24)return `${h}h ago`; const days=Math.floor(h/24); return `${days}d ago`; }
function vbInitials(name) { return String(name||"VB").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"VB"; }
function vbClientTransactions(id) {
  const s=vbGetState(), c=s.clients.find(x=>x.id===id);
  if(!c) return [];
  return s.transactions.filter(t=>t.clientId===id || (!t.clientId && t.clientAccountNumber===c.accountNumber)).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
}
function vbAddAudit(action, details="", actor="Administrator") { const s=vbGetState(), timestamp=new Date().toISOString(); s.audit.unshift({id:vbMakeId("AUD"),action,details,actor,timestamp}); s.audit=s.audit.slice(0,1000); vbSaveState(s); }
function vbAddNotification(clientId,title,message,type="info",state=null) { const s=state||vbGetState(); s.notifications.unshift({id:vbMakeId("NTF"),clientId,title,message,type,read:false,timestamp:new Date().toISOString()}); s.notifications=s.notifications.slice(0,1000); }
function vbDailyTransferTotal(clientId) { const start=new Date(); start.setHours(0,0,0,0); return vbGetState().transactions.filter(t=>t.clientId===clientId&&t.type==="transfer_out"&&new Date(t.timestamp)>=start).reduce((a,t)=>a+t.amount,0); }
function vbCreateTransaction(clientId,type,amount,status="Success",description="",meta={}) {
  const session=vbGetSession(); if(!session||session.role!=="admin") throw new Error("Only an authorized administrator can post deposits or withdrawals.");
  const s=vbGetState(), c=s.clients.find(x=>x.id===clientId); if(!c) throw new Error("Client account not found.");
  if(c.status!=="Active") throw new Error(`This account is ${c.status.toLowerCase()}. Transactions are unavailable.`);
  const value=Number(amount); if(!Number.isFinite(value)||value<=0) throw new Error("Enter a valid amount.");
  if(!["deposit","withdrawal"].includes(type)) throw new Error("Unsupported transaction type.");
  if(type==="withdrawal"&&value>c.balance) throw new Error("Insufficient funds. Withdrawal cannot exceed available balance.");
  if(status==="Success") c.balance=Number((c.balance+(type==="deposit"?value:-value)).toFixed(2));
  const timestamp=new Date().toISOString(), tx={id:vbMakeId("TX"),clientId,clientAccountNumber:c.accountNumber,clientName:c.name,type,amount:Number(value.toFixed(2)),status,description:String(description||"").trim().slice(0,120),timestamp,...meta};
  s.transactions.unshift(tx);
  const label=type==="deposit"?"Deposit":"Withdrawal", sign=type==="deposit"?"received":"completed";
  s.audit.unshift({id:vbMakeId("AUD"),action:`${label} ${sign}`,details:`${c.name} • ${vbFormatMoney(tx.amount,c.currency)}`,actor:"Administrator",timestamp});
  vbAddNotification(c.id,`${label} ${status.toLowerCase()}`,`${vbFormatMoney(tx.amount,c.currency)} ${type==="deposit"?"was added to":"was withdrawn from"} your account.`,type==="deposit"?"success":"warning",s);
  vbSaveState(s); return tx;
}
function vbTransferFunds(senderId,recipientAccount,amount,description="Internal transfer") {
  const session=vbGetSession(); if(!session||session.role!=="admin") throw new Error("Only an authorized administrator can perform transfers.");
  const s=vbGetState(), sender=s.clients.find(c=>c.id===senderId), recipient=s.clients.find(c=>c.accountNumber===String(recipientAccount).trim());
  if(!sender) throw new Error("Sender account not found."); if(sender.status!=="Active") throw new Error("Your account is restricted and cannot send transfers.");
  if(!recipient) throw new Error("Recipient account could not be found."); if(recipient.id===sender.id) throw new Error("You cannot transfer money to your own account.");
  if(recipient.status!=="Active") throw new Error("The recipient account is not active.");
  const value=Number(amount); if(!Number.isFinite(value)||value<=0) throw new Error("Enter a valid transfer amount.");
  if(value>sender.balance) throw new Error("Insufficient funds. Transfer cannot exceed available balance.");
  if(vbDailyTransferTotal(sender.id)+value>TRANSFER_DAILY_LIMIT) throw new Error(`Daily transfer limit is ${vbFormatMoney(TRANSFER_DAILY_LIMIT,sender.currency)}.`);
  const rate=vbGetRate(sender.currency,recipient.currency); if(!rate) throw new Error(`No exchange rate is configured for ${sender.currency} to ${recipient.currency}.`);
  const received=Number((value*rate).toFixed(2)), v=Number(value.toFixed(2)), timestamp=new Date().toISOString(), ref=vbMakeId("TRF"), desc=String(description||"Internal transfer").trim().slice(0,120)||"Internal transfer";
  sender.balance=Number((sender.balance-v).toFixed(2)); recipient.balance=Number((recipient.balance+received).toFixed(2));
  s.transactions.unshift({id:ref,clientId:sender.id,clientAccountNumber:sender.accountNumber,clientName:sender.name,type:"transfer_out",amount:v,currency:sender.currency,receivedAmount:received,receivedCurrency:recipient.currency,exchangeRate:rate,status:"Success",description:desc,timestamp,relatedClientId:recipient.id,relatedAccountNumber:recipient.accountNumber,direction:"out"});
  s.transactions.unshift({id:`${ref}-IN`,clientId:recipient.id,clientAccountNumber:recipient.accountNumber,clientName:recipient.name,type:"transfer_in",amount:received,currency:recipient.currency,sentAmount:v,sentCurrency:sender.currency,exchangeRate:rate,status:"Success",description:desc,timestamp,relatedClientId:sender.id,relatedAccountNumber:sender.accountNumber,direction:"in",relatedReference:ref});
  s.audit.unshift({id:vbMakeId("AUD"),action:"Internal transfer completed",details:`${sender.name} (${sender.accountNumber}) → ${recipient.name} (${recipient.accountNumber}) • ${vbFormatMoney(v,sender.currency)} → ${vbFormatMoney(received,recipient.currency)} • rate ${rate}`,actor:"Client / System",timestamp});
  vbAddNotification(sender.id,"Transfer sent",`${vbFormatMoney(v,sender.currency)} was sent to ${recipient.name}. They received ${vbFormatMoney(received,recipient.currency)}. Ref ${ref}.`,"success",s);
  vbAddNotification(recipient.id,"Transfer received",`${vbFormatMoney(received,recipient.currency)} was received from ${sender.name}. Original amount: ${vbFormatMoney(v,sender.currency)}. Ref ${ref}.`,"success",s);
  vbSaveState(s); return {reference:ref,sender,recipient,amount:v,receivedAmount:received,rate,timestamp};
}

function vbAdminPostTransaction(clientId,type,amount,status="Success",description="Administrator transaction") {
  return vbCreateTransaction(clientId,type,amount,status,description,{source:"Administrator"});
}

function vbCreateClient(data) {
  const s=vbGetState(), name=String(data.name||"").trim(), email=String(data.email||"").trim(), password=String(data.password||"");
  const balance=Number(data.initialBalance||0); if(!name||!email||!password) throw new Error("Complete name, email and password.");
  if(password.length<8) throw new Error("Client password must contain at least 8 characters."); if(!Number.isFinite(balance)||balance<0) throw new Error("Opening balance cannot be negative.");
  if(s.clients.some(c=>c.email.toLowerCase()===email.toLowerCase())) throw new Error("A client with this email already exists.");
  const now=new Date().toISOString(), c={id:vbMakeId("CLIENT"),name,email,password,phone:String(data.phone||"").trim(),dob:data.dob||"",address:String(data.address||"").trim(),photo:data.photo||"",accountType:data.accountType||"Savings Account",currency:VB_CURRENCIES[data.currency]?data.currency:CURRENCY,accountNumber:vbGenerateAccountNumber(),balance:Number(balance.toFixed(2)),status:"Active",createdAt:now,updatedAt:now};
  s.clients.push(c); if(balance>0) s.transactions.unshift({id:vbMakeId("TX"),clientId:c.id,clientAccountNumber:c.accountNumber,clientName:c.name,type:"deposit",amount:c.balance,currency:c.currency,status:"Success",description:"Opening balance",timestamp:now});
  s.audit.unshift({id:vbMakeId("AUD"),action:"Client account created",details:`${c.name} • ${c.accountNumber}`,actor:"Administrator",timestamp:now});
  vbAddNotification(c.id,"Welcome to Velorian Bank",`Your ${c.accountType} account ${c.accountNumber} (${vbGetCurrency(c.currency).code}) is ready.`,"success",s);
  vbSaveState(s); return c;
}
function vbUpdateClient(id,updates) {
 const s=vbGetState(),c=s.clients.find(x=>x.id===id); if(!c)throw new Error("Client account not found.");
 if(updates.email&&s.clients.some(x=>x.id!==id&&x.email.toLowerCase()===updates.email.trim().toLowerCase()))throw new Error("Another client already uses this email.");
 if(updates.currency&&updates.currency!==c.currency){const hasActivity=s.transactions.some(t=>t.clientId===id);if(hasActivity||Number(c.balance)!==0)throw new Error("Account currency cannot be changed after the account has a balance or transaction history. Create a new account instead.");if(!VB_CURRENCIES[updates.currency])throw new Error("Unsupported account currency.");}
 Object.assign(c,updates,{updatedAt:new Date().toISOString()}); if(updates.name!==undefined)c.name=updates.name.trim(); if(updates.email!==undefined)c.email=updates.email.trim(); if(updates.phone!==undefined)c.phone=updates.phone.trim(); if(updates.address!==undefined)c.address=updates.address.trim(); if(updates.password!==undefined&&updates.password.length<8)throw new Error("Password must contain at least 8 characters."); c.currency=VB_CURRENCIES[c.currency]?c.currency:CURRENCY;
 s.audit.unshift({id:vbMakeId("AUD"),action:"Client profile updated",details:`${c.name} • ${c.accountNumber} • ${c.currency}`,actor:"Administrator",timestamp:new Date().toISOString()}); vbSaveState(s); return c; }
function vbDeleteClient(id) {
  const s=vbGetState(), index=s.clients.findIndex(c=>c.id===id);
  if(index===-1) throw new Error("Client account not found.");
  const c=s.clients[index], now=new Date().toISOString();
  s.clients.splice(index,1);
  s.transactions=s.transactions.filter(t=>t.clientId!==id && t.clientAccountNumber!==c.accountNumber);
  s.notifications=s.notifications.filter(n=>n.clientId!==id);
  s.audit.unshift({id:vbMakeId("AUD"),action:"Client account deleted",details:`${c.name} • ${c.accountNumber}`,actor:s.admin?.name||"Administrator",timestamp:now});
  s.audit=s.audit.slice(0,1000);
  vbSaveState(s);
  return c;
}
function vbSetClientStatus(id,status) { if(!["Active","Suspended","Frozen","Closed"].includes(status))throw new Error("Invalid account status."); const s=vbGetState(),c=s.clients.find(x=>x.id===id); if(!c)throw new Error("Client account not found."); c.status=status; const ts=new Date().toISOString(); s.audit.unshift({id:vbMakeId("AUD"),action:`Account ${status.toLowerCase()}`,details:`${c.name} • ${c.accountNumber}`,actor:"Administrator",timestamp:ts}); vbAddNotification(c.id,`Account ${status.toLowerCase()}`,status==="Active"?"Your account is active again.":`Your account has been marked ${status.toLowerCase()}. Contact support if you need assistance.`,status==="Active"?"success":"warning",s); vbSaveState(s); return c; }
function vbChangeClientPassword(id,password) { if(!password||password.length<8)throw new Error("Password must contain at least 8 characters."); const s=vbGetState(),c=s.clients.find(x=>x.id===id); if(!c)throw new Error("Client account not found."); c.password=password; c.forcePasswordChange=true; s.audit.unshift({id:vbMakeId("AUD"),action:"Client password reset",details:c.accountNumber,actor:s.admin?.name||"Administrator",timestamp:new Date().toISOString()}); vbAddNotification(c.id,"Password reset","Your sign-in password was reset. Please create a new password when you next sign in.","info",s); vbSaveState(s); }
function vbChangeOwnPassword(clientId,current,next) { const s=vbGetState(),c=s.clients.find(x=>x.id===clientId); if(!c||c.password!==current)throw new Error("Current password is incorrect."); if(!next||next.length<8)throw new Error("New password must contain at least 8 characters."); c.password=next; c.forcePasswordChange=false; s.audit.unshift({id:vbMakeId("AUD"),action:"Client changed own password",details:c.accountNumber,actor:c.accountNumber,timestamp:new Date().toISOString()}); vbSaveState(s); }
function vbMarkNotificationsRead(clientId) { const s=vbGetState(); s.notifications.filter(n=>n.clientId===clientId).forEach(n=>n.read=true); vbSaveState(s); }
function vbExportStatement(clientId,from,to) {
  const c=vbFindClient(clientId); if(!c)throw new Error("Client not found.");
  const txs=vbClientTransactions(clientId).filter(t=>{const d=new Date(t.timestamp);return (!from||d>=new Date(from+"T00:00:00"))&&(!to||d<=new Date(to+"T23:59:59"));});
  const rows=txs.map(t=>({date:vbFormatDate(t.timestamp),reference:t.id,type:t.type,description:t.description,amount:t.type==="withdrawal"||t.type==="transfer_out"?-t.amount:t.amount,status:t.status}));
  const opening=txs.reduce((b,t)=>b-(t.type==="withdrawal"||t.type==="transfer_out"?-t.amount:t.amount),c.balance);
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>Velorian Bank Statement</title><style>body{font:13px Arial;color:#142235;margin:40px}header{display:flex;justify-content:space-between;border-bottom:3px solid #b58a3a;padding-bottom:18px}img{width:170px;height:65px;object-fit:contain}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:24px 0}.box{padding:14px;background:#f5f7fa;border-radius:10px}.box span{display:block;color:#6d7d8f;font-size:10px;text-transform:uppercase}.box strong{display:block;margin-top:6px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{text-align:left;padding:11px;border-bottom:1px solid #e3e7ec}th{font-size:10px;text-transform:uppercase;color:#68788a}.pos{color:#087b56}.neg{color:#b53d4c}.foot{margin-top:30px;color:#738296;font-size:10px}@media print{button{display:none}}</style></head><body><header><img src="assets/logo.jfif"><div style="text-align:right"><b>ACCOUNT STATEMENT</b><div>Generated ${new Date().toLocaleString()}</div></div></header><div class="meta"><div class="box"><span>Account holder</span><strong>${c.name}</strong></div><div class="box"><span>Account number</span><strong>${c.accountNumber}</strong></div><div class="box"><span>Account type</span><strong>${c.accountType}</strong></div><div class="box"><span>Period</span><strong>${from||"All time"} — ${to||"Present"}</strong></div><div class="box"><span>Opening balance</span><strong>${vbFormatMoney(opening,c.currency)}</strong></div><div class="box"><span>Closing balance</span><strong>${vbFormatMoney(c.balance,c.currency)}</strong></div></div><table><thead><tr><th>Date</th><th>Reference</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.date}</td><td>${r.reference}</td><td>${r.type.replaceAll("_"," ")}</td><td>${r.description||"—"}</td><td class="${r.amount>=0?"pos":"neg"}">${r.amount>=0?"+":"-"}${vbFormatMoney(Math.abs(r.amount),c.currency)}</td><td>${r.status}</td></tr>`).join("")||`<tr><td colspan="6">No transactions for this period.</td></tr>`}</tbody></table><div class="foot">Velorian Bank digital banking prototype. This statement is generated for demonstration purposes and is not a real financial document.</div><button onclick="window.print()" style="margin-top:20px;padding:10px 16px">Print / Save as PDF</button></body></html>`;
  const w=window.open("","_blank","noopener,noreferrer"); if(!w)throw new Error("Please allow pop-ups to generate the statement."); w.document.write(html); w.document.close();
}
