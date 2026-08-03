const DEFAULT_DB={
  settings:{
    salary:13500,debt:4000,cash:0,emergencyTarget:25000,emergencyCurrent:0,
    goldGrams:7,goldPrice:0,silverGrams:0,silverPrice:6.91,
    theme:"light",apiProvider:"",apiKey:""
  },
  budget:{
    "رسوم مرافقين":800,"إيجار":2000,"قسط سيارة":1700,"أكل وشرب":2000,
    "حضانة":500,"بنزين":300,"كهرباء":250,"صيانة سيارة":150,
    "اتصالات وإنترنت":0,"أخرى":0
  },
  expenses:[],incomes:[],investments:[],debtPayments:[]
};
let db=JSON.parse(localStorage.getItem("mohamedFinanceV2")||"null")||structuredClone(DEFAULT_DB);
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString("ar-SA",{maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const monthKey=(d=new Date())=>new Date(d).toISOString().slice(0,7);
function save(){localStorage.setItem("mohamedFinanceV2",JSON.stringify(db))}
function currentMonthExpenses(){return db.expenses.filter(x=>monthKey(x.date)===monthKey())}
function currentMonthIncome(){return db.incomes.filter(x=>monthKey(x.date)===monthKey()).reduce((a,b)=>a+Number(b.amount),0)}
function totalsByCategory(){
  let out={};currentMonthExpenses().forEach(x=>out[x.category]=(out[x.category]||0)+Number(x.amount));return out
}
function calcAssets(){
  const s=db.settings;
  const gold=s.goldGrams*s.goldPrice,silver=s.silverGrams*s.silverPrice;
  const investments=db.investments.reduce((a,b)=>a+Number(b.current||0),0);
  const total=s.cash+s.emergencyCurrent+gold+silver+investments;
  return {gold,silver,investments,total,net:total-s.debt}
}
function goTo(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));
  [...document.querySelectorAll("nav button")].find(x=>x.getAttribute("onclick")?.includes(id))?.classList.add("active");
  render();
}
function addExpense(){
  const amount=+$("expenseAmount").value;if(!amount)return alert("اكتب المبلغ");
  db.expenses.push({id:crypto.randomUUID(),amount,category:$("expenseCategory").value,note:$("expenseNote").value,date:$("expenseDate").value||today()});
  $("expenseAmount").value="";$("expenseNote").value="";save();render();goTo("home");
}
function addIncome(){
  const amount=+$("incomeAmount").value;if(!amount)return alert("اكتب المبلغ");
  db.incomes.push({id:crypto.randomUUID(),amount,type:$("incomeType").value,date:$("incomeDate").value||today()});
  $("incomeAmount").value="";save();render();
}
function payDebt(){
  const amount=+$("debtPayment").value;if(!amount)return;
  db.settings.debt=Math.max(0,db.settings.debt-amount);db.debtPayments.push({amount,date:today()});
  $("debtPayment").value="";save();render();alert("تم تسجيل السداد");
}
function openBudgetEditor(){
  $("budgetEditor").style.display=$("budgetEditor").style.display==="none"?"block":"none";
}
function saveBudget(){
  Object.keys(db.budget).forEach((k,i)=>db.budget[k]=+document.querySelector(`[data-budget="${i}"]`).value||0);
  save();render();$("budgetEditor").style.display="none";
}
function saveSettings(){
  Object.assign(db.settings,{
    salary:+$("settingSalary").value||0,debt:+$("settingDebt").value||0,cash:+$("settingCash").value||0,
    emergencyTarget:+$("settingEmergencyTarget").value||0,emergencyCurrent:+$("settingEmergencyCurrent").value||0
  });save();render();alert("تم الحفظ");
}
function saveMetalData(){
  Object.assign(db.settings,{
    goldGrams:+$("goldGrams").value||0,goldPrice:+$("goldPrice").value||0,
    silverGrams:+$("silverGrams").value||0,silverPrice:+$("silverPrice").value||0
  });save();render();
}
function addInvestment(){
  db.investments.push({
    id:crypto.randomUUID(),type:$("investmentType").value,
    cost:+$("investmentCost").value||0,current:+$("investmentCurrent").value||0,date:today()
  });
  $("investmentCost").value="";$("investmentCurrent").value="";save();render();
}
function saveApiSettings(){
  db.settings.apiProvider=$("apiProvider").value;db.settings.apiKey=$("apiKey").value.trim();save();alert("تم الحفظ");
}
async function refreshMetalPrices(){
  const {apiProvider,apiKey}=db.settings;
  if(!apiProvider||!apiKey){$("metalStatus").textContent="لا يوجد API Key. حدّث الأسعار يدويًا.";return}
  $("metalStatus").textContent="جاري التحديث...";
  try{
    if(apiProvider==="goldapi"){
      const [g,s]=await Promise.all([
        fetch("https://www.goldapi.io/api/XAU/SAR",{headers:{"x-access-token":apiKey}}).then(r=>r.json()),
        fetch("https://www.goldapi.io/api/XAG/SAR",{headers:{"x-access-token":apiKey}}).then(r=>r.json())
      ]);
      db.settings.goldPrice=Number(g.price_gram_24k||0);
      db.settings.silverPrice=Number(s.price_gram_24k||0);
    }else{
      const data=await fetch(`https://metals-api.com/api/latest?access_key=${encodeURIComponent(apiKey)}&base=SAR&symbols=XAU,XAG`).then(r=>r.json());
      if(!data.rates)throw new Error("No rates");
      db.settings.goldPrice=(1/data.rates.XAU)/31.1034768;
      db.settings.silverPrice=(1/data.rates.XAG)/31.1034768;
    }
    save();render();$("metalStatus").textContent="تم تحديث الأسعار بنجاح";
  }catch(e){$("metalStatus").textContent="تعذر التحديث. راجع API Key أو استخدم التحديث اليدوي."}
}
function exportJSON(){
  const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`mohamed-finance-${today()}.json`;a.click();
}
function importJSON(e){
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();render();alert("تم الاستيراد")}catch{alert("ملف غير صالح")}};r.readAsText(file);
}
function exportCSV(){
  const rows=[["date","category","note","amount"],...db.expenses.map(x=>[x.date,x.category,x.note||"",x.amount])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`expenses-${today()}.csv`;a.click();
}
function resetAll(){if(confirm("سيتم مسح كل البيانات. متأكد؟")){db=structuredClone(DEFAULT_DB);save();render()}}
function toggleTheme(){db.settings.theme=db.settings.theme==="dark"?"light":"dark";save();applyTheme()}
function applyTheme(){document.documentElement.setAttribute("data-theme",db.settings.theme||"light")}
async function enableNotifications(){
  if(!("Notification" in window))return alert("الإشعارات غير مدعومة");
  const p=await Notification.requestPermission();
  if(p==="granted")new Notification("مالي — Mohamed",{body:"تم تفعيل الإشعارات بنجاح"});
}
function printReport(){window.print()}
function drawBars(canvasId,labels,values){
  const c=$(canvasId),ctx=c.getContext("2d");const dpr=window.devicePixelRatio||1;
  const rect=c.getBoundingClientRect();c.width=rect.width*dpr;c.height=rect.height*dpr;ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,rect.width,rect.height);
  const style=getComputedStyle(document.documentElement);const primary=style.getPropertyValue("--primary2").trim(),text=style.getPropertyValue("--text").trim(),muted=style.getPropertyValue("--muted").trim();
  if(!values.some(v=>v>0)){ctx.fillStyle=muted;ctx.font="15px Arial";ctx.fillText("لا توجد بيانات كافية",rect.width/2-60,rect.height/2);return}
  const max=Math.max(...values,1),pad=30,barW=(rect.width-pad*2)/(values.length*1.5);
  values.forEach((v,i)=>{const h=(v/max)*(rect.height-60),x=pad+i*barW*1.5,y=rect.height-30-h;ctx.fillStyle=primary;ctx.fillRect(x,y,barW,h);ctx.fillStyle=text;ctx.font="11px Arial";ctx.fillText(labels[i].slice(0,8),x,rect.height-12)});
}
function drawTrend(){
  const labels=[],income=[],expense=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const k=monthKey(d);labels.push(d.toLocaleDateString("ar-SA",{month:"short"}));income.push(db.incomes.filter(x=>monthKey(x.date)===k).reduce((a,b)=>a+Number(b.amount),0));expense.push(db.expenses.filter(x=>monthKey(x.date)===k).reduce((a,b)=>a+Number(b.amount),0))}
  const c=$("trendChart"),ctx=c.getContext("2d"),dpr=window.devicePixelRatio||1,rect=c.getBoundingClientRect();c.width=rect.width*dpr;c.height=rect.height*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,rect.width,rect.height);
  const style=getComputedStyle(document.documentElement),text=style.getPropertyValue("--text").trim(),green=style.getPropertyValue("--primary2").trim(),gold=style.getPropertyValue("--accent").trim(),max=Math.max(...income,...expense,1),pad=35;
  function line(vals,color){ctx.beginPath();vals.forEach((v,i)=>{const x=pad+i*((rect.width-pad*2)/(vals.length-1)),y=rect.height-pad-(v/max)*(rect.height-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke()}
  line(income,green);line(expense,gold);ctx.fillStyle=text;ctx.font="11px Arial";labels.forEach((l,i)=>ctx.fillText(l,pad+i*((rect.width-pad*2)/(labels.length-1))-8,rect.height-12));
}
function render(){
  applyTheme();
  const s=db.settings,totals=totalsByCategory(),spent=Object.values(totals).reduce((a,b)=>a+b,0),income=currentMonthIncome()||s.salary,assets=calcAssets();
  $("currentMonthLabel").textContent=new Date().toLocaleDateString("ar-SA",{month:"long",year:"numeric"});
  $("kIncome").textContent=fmt(income);$("kSpent").textContent=fmt(spent);$("kRemaining").textContent=fmt(income-spent);$("kDebt").textContent=fmt(s.debt);
  $("cashValue").textContent=fmt(s.cash+s.emergencyCurrent);$("goldValue").textContent=fmt(assets.gold);$("silverValue").textContent=fmt(assets.silver);$("netWorthValue").textContent=fmt(assets.net);$("homeNetWorth").textContent=fmt(assets.net);
  const budgetTotal=Object.values(db.budget).reduce((a,b)=>a+Number(b),0);
  $("alerts").innerHTML=(spent>budgetTotal?'<div class="alert bad">تجاوزت إجمالي الميزانية الشهرية.</div>':'<div class="alert ok">الميزانية تحت السيطرة.</div>')+(s.debt>0?'<div class="alert">الأولوية: إنهاء الدين قبل زيادة الاستثمار.</div>':'');
  const ep=s.emergencyTarget?Math.min(100,s.emergencyCurrent/s.emergencyTarget*100):0;
  $("emergencyBar").style.width=ep+"%";$("emergencyBadge").textContent=`${fmt(s.emergencyCurrent)} / ${fmt(s.emergencyTarget)}`;$("emergencyHint").textContent=ep>=100?"تم الوصول للهدف":`متبقي ${fmt(Math.max(0,s.emergencyTarget-s.emergencyCurrent))} ريال`;
  let score=Math.round(Math.max(0,Math.min(100,35*Math.min(1,ep/100)+25*Math.max(0,1-s.debt/s.salary)+20*Math.min(1,Math.max(0,(income-spent)/income))+20*Math.min(1,assets.investments/100000))));
  $("healthScore").textContent=score;$("healthText").textContent=score>=85?"ممتاز":score>=70?"جيد":score>=50?"متوسط":"يحتاج تحسين";
  $("goalsList").innerHTML=[100000,250000,500000,750000,1000000].map(g=>{const p=Math.max(0,Math.min(100,assets.net/g*100));return `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between"><b>${fmt(g)} ريال</b><span>${p.toFixed(1)}%</span></div><div class="progress"><i style="width:${p}%"></i></div><div class="muted">المتبقي ${fmt(Math.max(0,g-assets.net))} ريال</div></div>`}).join("");
  $("budgetTable").innerHTML=Object.entries(db.budget).map(([cat,b])=>{const a=totals[cat]||0,r=b-a,over=b>0&&a>b;return `<tr><td>${cat}</td><td>${fmt(b)}</td><td>${fmt(a)}</td><td>${fmt(r)}</td><td style="color:${over?'var(--danger)':'var(--ok)'}">${over?'تجاوز':'ممتاز'}</td></tr>`}).join("");
  $("budgetInputs").innerHTML=Object.entries(db.budget).map(([cat,b],i)=>`<label>${cat}</label><input data-budget="${i}" type="number" value="${b}">`).join("");
  $("transactionsList").innerHTML=db.expenses.length?db.expenses.slice().reverse().slice(0,25).map(x=>`<div class="transaction"><div><b>${x.category}</b><div class="muted">${x.date} ${x.note||""}</div></div><b>${fmt(x.amount)} ريال</b></div>`).join(""):'<div class="empty">لا توجد عمليات</div>';
  $("investmentsList").innerHTML=db.investments.map(x=>`<div class="transaction"><div><b>${x.type}</b><div class="muted">${x.date}</div></div><div><b>${fmt(x.current)} ريال</b><div class="muted">تكلفة ${fmt(x.cost)}</div></div></div>`).join("");
  $("monthlyReport").innerHTML=`<table><tr><td>الدخل</td><td>${fmt(income)} ريال</td></tr><tr><td>المصروف</td><td>${fmt(spent)} ريال</td></tr><tr><td>المتبقي</td><td>${fmt(income-spent)} ريال</td></tr><tr><td>نسبة الادخار</td><td>${income?((income-spent)/income*100).toFixed(1):0}%</td></tr><tr><td>الدين</td><td>${fmt(s.debt)} ريال</td></tr><tr><td>صافي الثروة</td><td>${fmt(assets.net)} ريال</td></tr></table>`;
  ["settingSalary","settingDebt","settingCash","settingEmergencyTarget","settingEmergencyCurrent"].forEach(id=>$(id).value={settingSalary:s.salary,settingDebt:s.debt,settingCash:s.cash,settingEmergencyTarget:s.emergencyTarget,settingEmergencyCurrent:s.emergencyCurrent}[id]);
  $("goldGrams").value=s.goldGrams;$("goldPrice").value=s.goldPrice;$("silverGrams").value=s.silverGrams;$("silverPrice").value=s.silverPrice;$("apiProvider").value=s.apiProvider||"";$("apiKey").value=s.apiKey||"";
  const entries=Object.entries(totals).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,7);drawBars("categoryChart",entries.map(x=>x[0]),entries.map(x=>x[1]));drawTrend();save();
}
$("expenseCategory").innerHTML=Object.keys(db.budget).map(x=>`<option>${x}</option>`).join("");
$("expenseDate").value=$("incomeDate").value=today();
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
window.addEventListener("resize",()=>render());
render();