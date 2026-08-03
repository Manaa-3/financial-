const DEFAULT_DB={
 settings:{salary:13500,debt:4000,cash:0,emergencyTarget:25000,emergencyCurrent:0,theme:"light",goldApiKey:"",supabaseUrl:"",supabaseKey:""},
 budget:{"رسوم مرافقين":800,"إيجار":2000,"قسط سيارة":1700,"أكل وشرب":2000,"حضانة":500,"بنزين":300,"كهرباء":250,"صيانة سيارة":150,"اتصالات وإنترنت":0,"أخرى":0},
 expenses:[],incomes:[],investments:[],metals:{gold:[],silver:[]},metalPrices:{gold:0,silver:6.91},debtPayments:[],sync:{token:"",userId:"",email:""}
};
let db=JSON.parse(localStorage.getItem("mohamedFinanceV3")||"null")||structuredClone(DEFAULT_DB);
const $=id=>document.getElementById(id),fmt=n=>Number(n||0).toLocaleString("ar-SA",{maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10),monthKey=d=>new Date(d||new Date()).toISOString().slice(0,7);
const gregMonth=(d,opts={month:"long",year:"numeric"})=>new Intl.DateTimeFormat("ar-EG-u-ca-gregory",{...opts,calendar:"gregory"}).format(d);
let calendarDate=new Date(),metalMode="gold",reportMode="monthly",receiptData="";
function save(){localStorage.setItem("mohamedFinanceV3",JSON.stringify(db))}
function currentExpenses(){return db.expenses.filter(x=>monthKey(x.date)===monthKey())}
function currentIncome(){return db.incomes.filter(x=>monthKey(x.date)===monthKey()).reduce((a,b)=>a+Number(b.amount),0)}
function totalsByCategory(list=currentExpenses()){let o={};list.forEach(x=>o[x.category]=(o[x.category]||0)+Number(x.amount));return o}
function metalPosition(type){
 const tx=db.metals[type]||[];let grams=0,cost=0,realized=0;
 tx.forEach(t=>{if(t.action==="buy"){grams+=t.grams;cost+=t.grams*t.price}else if(t.action==="sell"){const avg=grams?cost/grams:0;grams-=t.grams;cost-=avg*t.grams;realized+=(t.price-avg)*t.grams}});
 const avg=grams?cost/grams:0,current=grams*(db.metalPrices[type]||0);return {grams,cost,avg,current,unrealized:current-cost,realized}
}
function assets(){
 const g=metalPosition("gold"),s=metalPosition("silver"),inv=db.investments.reduce((a,b)=>a+Number(b.current||0),0);
 const total=db.settings.cash+db.settings.emergencyCurrent+g.current+s.current+inv;return {g,s,inv,total,net:total-db.settings.debt}
}
function go(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));[...document.querySelectorAll("nav button")].find(x=>x.getAttribute("onclick")?.includes(`'${id}'`))?.classList.add("active");render()}
function toggleTheme(){db.settings.theme=db.settings.theme==="dark"?"light":"dark";save();render()}
function fileToDataURL(file,max=1200,quality=.72){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height;if(w>max||h>max){const ratio=Math.min(max/w,max/h);w*=ratio;h*=ratio}const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);resolve(c.toDataURL("image/jpeg",quality))};img.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}
$("expenseReceipt").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;receiptData=await fileToDataURL(f);$("receiptPreview").src=receiptData;$("receiptPreview").style.display="block"});
function addExpense(){const amount=+$("expenseAmount").value;if(!amount)return alert("اكتب المبلغ");db.expenses.push({id:crypto.randomUUID(),amount,category:$("expenseCategory").value,note:$("expenseNote").value,date:$("expenseDate").value||today(),receipt:receiptData});receiptData="";$("expenseAmount").value="";$("expenseNote").value="";$("receiptPreview").style.display="none";save();render();go("home")}
function addIncome(){const amount=+$("incomeAmount").value;if(!amount)return;db.incomes.push({id:crypto.randomUUID(),amount,type:$("incomeType").value,date:$("incomeDate").value||today()});$("incomeAmount").value="";save();render()}
function payDebt(){const a=+$("debtPayment").value;if(!a)return;db.settings.debt=Math.max(0,db.settings.debt-a);db.debtPayments.push({amount:a,date:today()});$("debtPayment").value="";save();render()}
function toggleBudgetEditor(){$("budgetEditor").style.display=$("budgetEditor").style.display==="none"?"block":"none"}
function saveBudget(){Object.keys(db.budget).forEach((k,i)=>db.budget[k]=+document.querySelector(`[data-budget="${i}"]`).value||0);save();render();$("budgetEditor").style.display="none"}
function saveSettings(){Object.assign(db.settings,{salary:+$("settingSalary").value||0,debt:+$("settingDebt").value||0,cash:+$("settingCash").value||0,emergencyTarget:+$("settingEmergencyTarget").value||0,emergencyCurrent:+$("settingEmergencyCurrent").value||0});save();render()}
function saveApiKey(){db.settings.goldApiKey=$("goldApiKey").value.trim();save();alert("تم الحفظ")}
async function refreshMetalPrices(){if(!db.settings.goldApiKey)return alert("أدخل GoldAPI Key من الإعدادات");try{const h={"x-access-token":db.settings.goldApiKey};const [g,s]=await Promise.all([fetch("https://www.goldapi.io/api/XAU/SAR",{headers:h}).then(r=>r.json()),fetch("https://www.goldapi.io/api/XAG/SAR",{headers:h}).then(r=>r.json())]);db.metalPrices.gold=Number(g.price_gram_24k||db.metalPrices.gold);db.metalPrices.silver=Number(s.price_gram_24k||db.metalPrices.silver);save();render();alert("تم تحديث الأسعار")}catch{alert("تعذر التحديث")}}
function showMetal(type,btn){metalMode=type;document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));btn?.classList.add("active");renderMetal()}
function addMetalTx(){const action=$("metalAction").value,grams=+$("metalGrams").value,price=+$("metalTxPrice").value,date=$("metalDate").value||today();if(!grams||!price)return;db.metals[metalMode].push({id:crypto.randomUUID(),action,grams,price,date});save();render()}
function deleteMetalTx(id){db.metals[metalMode]=db.metals[metalMode].filter(x=>x.id!==id);save();render()}
function addInvestment(){db.investments.push({id:crypto.randomUUID(),type:$("investmentType").value,cost:+$("investmentCost").value||0,current:+$("investmentCurrent").value||0,date:today()});$("investmentCost").value=$("investmentCurrent").value="";save();render()}
function renderTransactions(){
 const q=$("searchInput").value.trim().toLowerCase(),cat=$("filterCategory").value,m=$("filterMonth").value;
 const list=db.expenses.slice().reverse().filter(x=>(!q||`${x.amount} ${x.category} ${x.note||""}`.toLowerCase().includes(q))&&(!cat||x.category===cat)&&(!m||monthKey(x.date)===m));
 $("resultCount").textContent=`${list.length} عملية`;
 $("transactionsList").innerHTML=list.length?list.map(x=>`<div class="transaction"><div style="display:flex;gap:10px;align-items:center">${x.receipt?`<img src="${x.receipt}" onclick="openReceipt('${x.id}')">`:""}<div><b>${x.category}</b><div class="muted">${formatDate(x.date)} ${x.note||""}</div></div></div><b>${fmt(x.amount)} ريال</b></div>`).join(""):'<div class="empty">لا توجد نتائج</div>'
}
function openReceipt(id){const x=db.expenses.find(e=>e.id===id);if(x?.receipt){const w=open();w.document.write(`<img src="${x.receipt}" style="max-width:100%">`)}}
function formatDate(s){return new Intl.DateTimeFormat("ar-EG-u-ca-gregory",{day:"2-digit",month:"2-digit",year:"numeric",calendar:"gregory"}).format(new Date(s))}
function changeCalendar(n){calendarDate.setMonth(calendarDate.getMonth()+n);renderCalendar()}
function renderCalendar(){
 $("calendarTitle").textContent=gregMonth(calendarDate);
 const y=calendarDate.getFullYear(),m=calendarDate.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate();
 const names=["أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة","سبت"];let html=names.map(x=>`<div class="cal-head">${x}</div>`).join("");
 for(let i=0;i<first.getDay();i++)html+='<div></div>';
 for(let d=1;d<=days;d++){const iso=`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`,has=db.expenses.some(x=>x.date===iso);html+=`<button class="cal-day ${has?"has-expense":""}" onclick="showCalendarDay('${iso}')">${d}${has?'<span class="dot"></span>':""}</button>`}
 $("calendarGrid").innerHTML=html
}
function showCalendarDay(iso){const list=db.expenses.filter(x=>x.date===iso),total=list.reduce((a,b)=>a+Number(b.amount),0);$("calendarDayDetails").innerHTML=list.length?`<p><b>${formatDate(iso)}</b> — ${fmt(total)} ريال</p>`+list.map(x=>`<div class="transaction"><span>${x.category}</span><b>${fmt(x.amount)}</b></div>`).join(""):'<div class="empty">لا توجد مصروفات</div>'}
function setReportMode(mode,btn){reportMode=mode;document.querySelectorAll("#reports .tabs button").forEach(x=>x.classList.remove("active"));btn.classList.add("active");renderReport()}
function renderReport(){
 if(reportMode==="monthly"){const e=currentExpenses(),i=currentIncome()||db.settings.salary,total=e.reduce((a,b)=>a+Number(b.amount),0),top=Object.entries(totalsByCategory(e)).sort((a,b)=>b[1]-a[1])[0];$("reportBody").innerHTML=`<h2>${gregMonth(new Date())}</h2><table><tr><td>الدخل</td><td>${fmt(i)} ريال</td></tr><tr><td>المصروف</td><td>${fmt(total)} ريال</td></tr><tr><td>المتبقي</td><td>${fmt(i-total)} ريال</td></tr><tr><td>نسبة الادخار</td><td>${i?((i-total)/i*100).toFixed(1):0}%</td></tr><tr><td>أكبر فئة</td><td>${top?`${top[0]} — ${fmt(top[1])}`:"-"}</td></tr></table>`}
 else{const y=new Date().getFullYear(),months=[];for(let m=0;m<12;m++){const k=`${y}-${String(m+1).padStart(2,"0")}`,e=db.expenses.filter(x=>monthKey(x.date)===k).reduce((a,b)=>a+Number(b.amount),0),i=db.incomes.filter(x=>monthKey(x.date)===k).reduce((a,b)=>a+Number(b.amount),0);months.push({name:gregMonth(new Date(y,m,1),{month:"short"}),e,i})}const te=months.reduce((a,b)=>a+b.e,0),ti=months.reduce((a,b)=>a+b.i,0);$("reportBody").innerHTML=`<h2>تحليل سنة ${y}</h2><table><tr><td>إجمالي الدخل</td><td>${fmt(ti)} ريال</td></tr><tr><td>إجمالي المصروف</td><td>${fmt(te)} ريال</td></tr><tr><td>صافي الادخار</td><td>${fmt(ti-te)} ريال</td></tr></table><div class="chart"><canvas id="annualReportChart"></canvas></div>`;setTimeout(()=>drawLine("annualReportChart",months.map(x=>x.name),[{values:months.map(x=>x.i),color:"#26664A"},{values:months.map(x=>x.e),color:"#B58B35"}]),30)}
}
function printReport(){window.print()}
function exportExcel(){
 const rows=[["Date","Category","Note","Amount"],...db.expenses.map(x=>[x.date,x.category,x.note||"",x.amount])];
 let html="<table>"+rows.map(r=>"<tr>"+r.map(v=>`<td>${String(v).replaceAll("&","&amp;").replaceAll("<","&lt;")}</td>`).join("")+"</tr>").join("")+"</table>";
 const blob=new Blob(["\ufeff"+html],{type:"application/vnd.ms-excel"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Mohamed_Finance_${today()}.xls`;a.click()
}
function exportJSON(){const b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`mohamed-finance-${today()}.json`;a.click()}
function importJSON(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();alert("تم الاستيراد")}catch{alert("ملف غير صالح")}};r.readAsText(f)}
function resetAll(){if(confirm("متأكد من مسح كل البيانات؟")){db=structuredClone(DEFAULT_DB);save();render()}}
async function enableNotifications(){if(!("Notification" in window))return alert("غير مدعوم");const p=await Notification.requestPermission();if(p==="granted")new Notification("مالي — Mohamed",{body:"تم تفعيل الإشعارات"})}
function drawDonut(id,labels,values){
 const c=$(id),ctx=c.getContext("2d"),r=c.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=r.width*dpr;c.height=r.height*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,r.width,r.height);
 const colors=["#26664A","#B58B35","#4A7AA3","#A35C7A","#6F7E59","#C46C47","#7358A6","#3A9A9C"],total=values.reduce((a,b)=>a+b,0);
 if(!total){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--muted");ctx.fillText("لا توجد بيانات",r.width/2-35,r.height/2);return}
 let start=-Math.PI/2;values.forEach((v,i)=>{const a=v/total*Math.PI*2;ctx.beginPath();ctx.arc(r.width/2,r.height/2-8,78,start,start+a);ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=34;ctx.stroke();start+=a});
 ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--text");ctx.textAlign="center";ctx.font="bold 22px Arial";ctx.fillText(fmt(total),r.width/2,r.height/2);ctx.font="12px Arial";ctx.fillText("ريال",r.width/2,r.height/2+20)
}
function drawLine(id,labels,series){
 const c=$(id);if(!c)return;const ctx=c.getContext("2d"),r=c.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=r.width*dpr;c.height=r.height*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,r.width,r.height);
 const all=series.flatMap(s=>s.values),max=Math.max(...all,1),pad=34,text=getComputedStyle(document.documentElement).getPropertyValue("--text");
 series.forEach(s=>{ctx.beginPath();s.values.forEach((v,i)=>{const x=pad+i*((r.width-pad*2)/(labels.length-1||1)),y=r.height-pad-(v/max)*(r.height-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=s.color;ctx.lineWidth=3;ctx.stroke()});
 ctx.fillStyle=text;ctx.font="10px Arial";labels.forEach((l,i)=>ctx.fillText(l,pad+i*((r.width-pad*2)/(labels.length-1||1))-8,r.height-10))
}
function renderMetal(){
 const name=metalMode==="gold"?"الذهب":"الفضة",p=metalPosition(metalMode),price=db.metalPrices[metalMode]||0;
 $("metalForm").innerHTML=`<div class="row"><div><label>العملية</label><select id="metalAction"><option value="buy">شراء</option><option value="sell">بيع</option></select></div><div><label>التاريخ</label><input id="metalDate" type="date" value="${today()}"></div></div><div class="row"><div><label>الجرامات</label><input id="metalGrams" type="number"></div><div><label>سعر الجرام</label><input id="metalTxPrice" type="number" value="${price}"></div></div><label>سعر السوق الحالي</label><input id="metalMarketPrice" type="number" value="${price}" onchange="db.metalPrices['${metalMode}']=+this.value;save();render()"><button class="primary" onclick="addMetalTx()">إضافة العملية</button>`;
 $("metalSummary").innerHTML=`<table><tr><td>الرصيد</td><td>${fmt(p.grams)} جم</td></tr><tr><td>متوسط الشراء</td><td>${fmt(p.avg)} ريال/جم</td></tr><tr><td>القيمة الحالية</td><td>${fmt(p.current)} ريال</td></tr><tr><td>ربح/خسارة غير محققة</td><td style="color:${p.unrealized>=0?"var(--ok)":"var(--danger)"}">${fmt(p.unrealized)} ريال</td></tr><tr><td>ربح/خسارة محققة</td><td>${fmt(p.realized)} ريال</td></tr></table>`;
 $("metalTransactions").innerHTML=(db.metals[metalMode]||[]).slice().reverse().map(t=>`<div class="transaction"><div><b>${t.action==="buy"?"شراء":"بيع"} ${name}</b><div class="muted">${formatDate(t.date)} — ${fmt(t.grams)} جم × ${fmt(t.price)}</div></div><button class="secondary" onclick="deleteMetalTx('${t.id}')">حذف</button></div>`).join("")
}
function saveSyncSettings(){db.settings.supabaseUrl=$("supabaseUrl").value.trim();db.settings.supabaseKey=$("supabaseKey").value.trim();save()}
async function syncSignUp(){saveSyncSettings();const u=db.settings.supabaseUrl,k=db.settings.supabaseKey,email=$("syncEmail").value,pwd=$("syncPassword").value;try{const x=await fetch(`${u}/auth/v1/signup`,{method:"POST",headers:{"apikey":k,"Content-Type":"application/json"},body:JSON.stringify({email,password:pwd})}).then(r=>r.json());$("syncStatus").textContent=x.id?"تم إنشاء الحساب. تحقق من البريد إن طُلب.":(x.msg||x.error_description||"تعذر الإنشاء")}catch{$("syncStatus").textContent="تعذر الاتصال"}}
async function syncSignIn(){saveSyncSettings();const u=db.settings.supabaseUrl,k=db.settings.supabaseKey,email=$("syncEmail").value,pwd=$("syncPassword").value;try{const x=await fetch(`${u}/auth/v1/token?grant_type=password`,{method:"POST",headers:{"apikey":k,"Content-Type":"application/json"},body:JSON.stringify({email,password:pwd})}).then(r=>r.json());if(x.access_token){db.sync={token:x.access_token,userId:x.user.id,email};save();$("syncStatus").textContent=`متصل: ${email}`}else $("syncStatus").textContent=x.error_description||"فشل الدخول"}catch{$("syncStatus").textContent="تعذر الاتصال"}}
async function pushCloud(){const {supabaseUrl:u,supabaseKey:k}=db.settings,{token,userId}=db.sync;if(!token)return alert("سجل الدخول أولًا");const payload={...db,sync:{token:"",userId:"",email:db.sync.email}};try{const r=await fetch(`${u}/rest/v1/finance_backups?on_conflict=user_id`,{method:"POST",headers:{"apikey":k,"Authorization":`Bearer ${token}`,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates"},body:JSON.stringify({user_id:userId,data:payload,updated_at:new Date().toISOString()})});$("syncStatus").textContent=r.ok?"تم رفع البيانات للسحابة":"فشل الرفع"}catch{$("syncStatus").textContent="تعذر الاتصال"}}
async function pullCloud(){const {supabaseUrl:u,supabaseKey:k}=db.settings,{token,userId,email}=db.sync;if(!token)return alert("سجل الدخول أولًا");try{const x=await fetch(`${u}/rest/v1/finance_backups?user_id=eq.${userId}&select=data`,{headers:{"apikey":k,"Authorization":`Bearer ${token}`}}).then(r=>r.json());if(x[0]?.data){const sync=db.sync,settings={...x[0].data.settings,supabaseUrl:u,supabaseKey:k};db={...x[0].data,settings,sync};save();render();$("syncStatus").textContent="تم استرجاع البيانات"}else $("syncStatus").textContent="لا توجد نسخة سحابية"}catch{$("syncStatus").textContent="تعذر الاتصال"}}
function render(){
 document.documentElement.setAttribute("data-theme",db.settings.theme||"light");
 $("monthTitle").textContent=gregMonth(new Date());
 const e=currentExpenses(),spent=e.reduce((a,b)=>a+Number(b.amount),0),income=currentIncome()||db.settings.salary,a=assets();
 $("kIncome").textContent=fmt(income);$("kSpent").textContent=fmt(spent);$("kRemaining").textContent=fmt(income-spent);$("kDebt").textContent=fmt(db.settings.debt);
 $("cashValue").textContent=fmt(db.settings.cash+db.settings.emergencyCurrent);$("goldValue").textContent=fmt(a.g.current);$("silverValue").textContent=fmt(a.s.current);$("netWorthValue").textContent=fmt(a.net);
 const bt=Object.values(db.budget).reduce((x,y)=>x+Number(y),0);$("alerts").innerHTML=(spent>bt?'<div class="alert bad">تجاوزت الميزانية الشهرية.</div>':'<div class="alert ok">الميزانية تحت السيطرة.</div>')+(db.settings.debt>0?'<div class="alert">الأولوية الحالية: سداد الدين ثم تكوين احتياطي الطوارئ.</div>':'');
 const ep=db.settings.emergencyTarget?Math.min(100,db.settings.emergencyCurrent/db.settings.emergencyTarget*100):0;$("emergencyBar").style.width=ep+"%";$("emergencyBadge").textContent=`${fmt(db.settings.emergencyCurrent)} / ${fmt(db.settings.emergencyTarget)}`;$("emergencyHint").textContent=`متبقي ${fmt(Math.max(0,db.settings.emergencyTarget-db.settings.emergencyCurrent))} ريال`;
 const score=Math.round(Math.max(0,Math.min(100,35*ep/100+25*Math.max(0,1-db.settings.debt/db.settings.salary)+20*Math.max(0,(income-spent)/income)+20*Math.min(1,a.inv/100000))));$("healthScore").textContent=score;$("healthText").textContent=score>=85?"ممتاز":score>=70?"جيد":score>=50?"متوسط":"يحتاج تحسين";
 $("goalsList").innerHTML=[100000,250000,500000,750000,1000000].map(g=>{const p=Math.max(0,Math.min(100,a.net/g*100));return `<div style="margin:13px 0"><div style="display:flex;justify-content:space-between"><b>${fmt(g)} ريال</b><span>${p.toFixed(1)}%</span></div><div class="progress"><i style="width:${p}%"></i></div><div class="muted">المتبقي ${fmt(Math.max(0,g-a.net))} ريال</div></div>`}).join("");
 const totals=totalsByCategory();$("budgetTable").innerHTML=Object.entries(db.budget).map(([c,b])=>{const x=totals[c]||0,o=b>0&&x>b;return `<tr><td>${c}</td><td>${fmt(b)}</td><td>${fmt(x)}</td><td>${fmt(b-x)}</td><td style="color:${o?"var(--danger)":"var(--ok)"}">${o?"تجاوز":"ضمن الحد"}</td></tr>`}).join("");
 $("budgetInputs").innerHTML=Object.entries(db.budget).map(([c,b],i)=>`<label>${c}</label><input data-budget="${i}" type="number" value="${b}">`).join("");
 $("investmentsList").innerHTML=db.investments.map(x=>`<div class="transaction"><div><b>${x.type}</b><div class="muted">${formatDate(x.date)}</div></div><div><b>${fmt(x.current)} ريال</b><div class="muted">تكلفة ${fmt(x.cost)}</div></div></div>`).join("");
 $("settingSalary").value=db.settings.salary;$("settingDebt").value=db.settings.debt;$("settingCash").value=db.settings.cash;$("settingEmergencyTarget").value=db.settings.emergencyTarget;$("settingEmergencyCurrent").value=db.settings.emergencyCurrent;$("goldApiKey").value=db.settings.goldApiKey||"";$("supabaseUrl").value=db.settings.supabaseUrl||"";$("supabaseKey").value=db.settings.supabaseKey||"";$("syncEmail").value=db.sync.email||"";
 $("filterCategory").innerHTML='<option value="">كل الفئات</option>'+Object.keys(db.budget).map(x=>`<option>${x}</option>`).join("");
 renderTransactions();renderCalendar();renderMetal();renderReport();
 const entries=Object.entries(totals).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);drawDonut("donutChart",entries.map(x=>x[0]),entries.map(x=>x[1]));
 const labels=[],inc=[],exp=[];for(let i=11;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const k=monthKey(d);labels.push(gregMonth(d,{month:"short"}));inc.push(db.incomes.filter(x=>monthKey(x.date)===k).reduce((a,b)=>a+Number(b.amount),0));exp.push(db.expenses.filter(x=>monthKey(x.date)===k).reduce((a,b)=>a+Number(b.amount),0))}drawLine("yearChart",labels,[{values:inc,color:"#26664A"},{values:exp,color:"#B58B35"}]);save()
}
$("expenseCategory").innerHTML=Object.keys(db.budget).map(x=>`<option>${x}</option>`).join("");$("expenseDate").value=$("incomeDate").value=today();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
window.addEventListener("resize",render);render();