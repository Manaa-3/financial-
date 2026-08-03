
const h=React.createElement;
const DEFAULT={
 settings:{salary:13500,debt:4000,cash:0,emergency:0,emergencyTarget:25000,theme:"light",pin:"",firebaseApiKey:"",firebaseProjectId:""},
 budget:{"رسوم مرافقين":800,"إيجار":2000,"قسط سيارة":1700,"أكل وشرب":2000,"حضانة":500,"بنزين":300,"كهرباء":250,"صيانة سيارة":150,"أخرى":0},
 expenses:[],incomes:[],assets:{gold:0,silver:0,investments:0},goals:[{id:"1",name:"أول 100 ألف",target:100000,current:0},{id:"2",name:"تعليم الابن",target:300000,current:0}]
};
function load(){try{return JSON.parse(localStorage.getItem("financeV5"))||structuredClone(DEFAULT)}catch{return structuredClone(DEFAULT)}}
function money(n){return Number(n||0).toLocaleString("ar-SA",{maximumFractionDigits:2})}
function mk(d=new Date()){return new Date(d).toISOString().slice(0,7)}
function today(){return new Date().toISOString().slice(0,10)}
function App(){
 const [db,setDb]=React.useState(load);
 const [page,setPage]=React.useState("home");
 const [locked,setLocked]=React.useState(!!db.settings.pin);
 const [pin,setPin]=React.useState("");
 React.useEffect(()=>{localStorage.setItem("financeV5",JSON.stringify(db));document.documentElement.setAttribute("data-theme",db.settings.theme)},[db]);
 const patch=(fn)=>setDb(old=>{const n=structuredClone(old);fn(n);return n});
 const monthExpenses=db.expenses.filter(x=>mk(x.date)===mk());
 const spent=monthExpenses.reduce((a,b)=>a+Number(b.amount),0);
 const income=db.incomes.filter(x=>mk(x.date)===mk()).reduce((a,b)=>a+Number(b.amount),0)||db.settings.salary;
 const net=db.settings.cash+db.settings.emergency+db.assets.gold+db.assets.silver+db.assets.investments-db.settings.debt;
 const budgetTotal=Object.values(db.budget).reduce((a,b)=>a+Number(b),0);
 const savings=income?Math.max(0,(income-spent)/income):0;
 const debtScore=Math.max(0,1-db.settings.debt/db.settings.salary);
 const emergencyScore=db.settings.emergencyTarget?Math.min(1,db.settings.emergency/db.settings.emergencyTarget):0;
 const score=Math.round((savings*.35+debtScore*.3+emergencyScore*.25+Math.min(1,db.assets.investments/100000)*.1)*100);
 function unlock(){if(pin===db.settings.pin){setLocked(false);setPin("")}}
 function Header(){return h("header",null,h("div",{className:"top"},h("div",null,h("h1",null,"مالي V5 — Mohamed"),h("p",null,new Intl.DateTimeFormat("ar-EG-u-ca-gregory",{month:"long",year:"numeric"}).format(new Date()))),h("div",null,h("button",{className:"icon",onClick:()=>patch(d=>d.settings.theme=d.settings.theme==="dark"?"light":"dark")},"◐")," ",h("button",{className:"icon",onClick:()=>db.settings.pin&&setLocked(true)},"🔒"))))}
 function Nav(){return h("nav",null,[["home","الرئيسية"],["expenses","المصروفات"],["wealth","الثروة"],["goals","الأهداف"],["reports","التقارير"],["settings","الإعدادات"]].map(([id,label])=>h("button",{key:id,className:page===id?"active":"",onClick:()=>setPage(id)},label)))}
 function Home(){return h("div",{className:"page"},h("div",{className:"grid"},[
  ["الدخل",income,"ريال"],["المصروف",spent,"هذا الشهر"],["المتبقي",income-spent,"ريال"],["صافي الثروة",net,"ريال"]
 ].map((x,i)=>h("div",{className:"card kpi",key:i},h("span",null,x[0]),h("b",null,money(x[1])),h("small",null,x[2])))),
 spent>budgetTotal?h("div",{className:"alert bad"},"تجاوزت الميزانية الشهرية."):h("div",{className:"alert ok"},"الميزانية تحت السيطرة."),
 db.settings.debt>0&&h("div",{className:"alert"},"الأولوية الحالية: سداد الدين المتبقي ",money(db.settings.debt)," ريال."),
 h("div",{className:"card"},h("div",{className:"sh"},h("h2",null,"Financial Score"),h("span",{className:"pill"},"من 100")),h("div",{className:"score"},score),h("div",{className:"muted"},"الادخار، الدين، الطوارئ والاستثمار")),
 h("div",{className:"card"},h("div",{className:"sh"},h("h2",null,"الأهداف"),h("button",{className:"secondary",onClick:()=>setPage("goals")},"إدارة")),db.goals.map(g=>{let p=Math.min(100,g.current/g.target*100);return h("div",{key:g.id,style:{margin:"12px 0"}},h("div",null,h("b",null,g.name),h("span",{style:{float:"left"}},p.toFixed(1),"%")),h("div",{className:"progress"},h("i",{style:{width:p+"%"}})))})
 )}
 function Expenses(){
  const [amount,setAmount]=React.useState(""),[cat,setCat]=React.useState(Object.keys(db.budget)[0]),[note,setNote]=React.useState("");
  const add=()=>{if(!+amount)return;patch(d=>d.expenses.push({id:crypto.randomUUID(),amount:+amount,category:cat,note,date:today()}));setAmount("");setNote("")};
  return h("div",{className:"page"},h("div",{className:"card"},h("h2",null,"إضافة مصروف"),h("label",null,"المبلغ"),h("input",{type:"number",value:amount,onChange:e=>setAmount(e.target.value)}),h("label",null,"الفئة"),h("select",{value:cat,onChange:e=>setCat(e.target.value)},Object.keys(db.budget).map(x=>h("option",{key:x},x))),h("label",null,"ملاحظة"),h("input",{value:note,onChange:e=>setNote(e.target.value)}),h("button",{className:"primary",onClick:add},"حفظ")),
  h("div",{className:"card"},h("h2",null,"آخر العمليات"),db.expenses.slice().reverse().slice(0,30).map(x=>h("div",{className:"tx",key:x.id},h("div",null,h("b",null,x.category),h("div",{className:"muted"},x.date," ",x.note||"")),h("b",null,money(x.amount)," ريال")))))
 }
 function Wealth(){return h("div",{className:"page"},h("div",{className:"grid"},[["الكاش",db.settings.cash],["الطوارئ",db.settings.emergency],["الذهب والفضة",db.assets.gold+db.assets.silver],["الاستثمارات",db.assets.investments]].map((x,i)=>h("div",{className:"card kpi",key:i},h("span",null,x[0]),h("b",null,money(x[1]))))),
 h("div",{className:"card"},h("h2",null,"تحديث الأصول"),["cash","emergency"].map(k=>h(React.Fragment,{key:k},h("label",null,k==="cash"?"الكاش":"احتياطي الطوارئ"),h("input",{type:"number",value:db.settings[k],onChange:e=>patch(d=>d.settings[k]=+e.target.value)}))),["gold","silver","investments"].map(k=>h(React.Fragment,{key:k},h("label",null,{gold:"قيمة الذهب",silver:"قيمة الفضة",investments:"الاستثمارات"}[k]),h("input",{type:"number",value:db.assets[k],onChange:e=>patch(d=>d.assets[k]=+e.target.value)})))))
 }
 function Goals(){
  const [name,setName]=React.useState(""),[target,setTarget]=React.useState("");
  return h("div",{className:"page"},h("div",{className:"card"},h("h2",null,"إضافة هدف"),h("label",null,"اسم الهدف"),h("input",{value:name,onChange:e=>setName(e.target.value)}),h("label",null,"المبلغ المستهدف"),h("input",{type:"number",value:target,onChange:e=>setTarget(e.target.value)}),h("button",{className:"primary",onClick:()=>{if(!name||!+target)return;patch(d=>d.goals.push({id:crypto.randomUUID(),name,target:+target,current:0}));setName("");setTarget("")}},"إضافة")),
  h("div",{className:"card"},db.goals.map(g=>h("div",{className:"tx",key:g.id},h("div",null,h("b",null,g.name),h("div",{className:"muted"},money(g.current)," / ",money(g.target))),h("input",{style:{width:"110px"},type:"number",value:g.current,onChange:e=>patch(d=>d.goals.find(x=>x.id===g.id).current=+e.target.value)}))))
 }
 function Reports(){return h("div",{className:"page"},h("div",{className:"card"},h("h2",null,"ملخص الشهر"),h("div",{className:"tx"},h("span",null,"الدخل"),h("b",null,money(income))),h("div",{className:"tx"},h("span",null,"المصروف"),h("b",null,money(spent))),h("div",{className:"tx"},h("span",null,"الادخار"),h("b",null,money(income-spent))),h("button",{className:"primary",onClick:()=>window.print()},"حفظ PDF")))}
 function Settings(){
  const [newPin,setNewPin]=React.useState("");
  return h("div",{className:"page"},h("div",{className:"card"},h("h2",null,"الإعدادات الأساسية"),h("label",null,"الراتب"),h("input",{type:"number",value:db.settings.salary,onChange:e=>patch(d=>d.settings.salary=+e.target.value)}),h("label",null,"الدين"),h("input",{type:"number",value:db.settings.debt,onChange:e=>patch(d=>d.settings.debt=+e.target.value)}),h("label",null,"هدف الطوارئ"),h("input",{type:"number",value:db.settings.emergencyTarget,onChange:e=>patch(d=>d.settings.emergencyTarget=+e.target.value)})),
  h("div",{className:"card"},h("h2",null,"الحماية"),h("p",{className:"muted"},"ضع PIN من 4 إلى 6 أرقام. بعد الحفظ اضغط علامة القفل أعلى الشاشة."),h("input",{type:"password",inputMode:"numeric",maxLength:6,value:newPin,onChange:e=>setNewPin(e.target.value)}),h("button",{className:"primary",onClick:()=>{if(newPin&&!/^\\d{4,6}$/.test(newPin))return alert("PIN من 4 إلى 6 أرقام");patch(d=>d.settings.pin=newPin);setNewPin("");alert("تم حفظ PIN")}},"حفظ PIN"),db.settings.pin&&h("button",{className:"danger",style:{width:"100%",marginTop:"8px"},onClick:()=>patch(d=>d.settings.pin="")},"إلغاء PIN")),
  h("div",{className:"card"},h("h2",null,"Firebase — المرحلة القادمة"),h("p",{className:"muted"},"الحقول جاهزة لربط المزامنة السحابية لاحقًا."),h("label",null,"Project ID"),h("input",{value:db.settings.firebaseProjectId,onChange:e=>patch(d=>d.settings.firebaseProjectId=e.target.value)}),h("label",null,"API Key"),h("input",{type:"password",value:db.settings.firebaseApiKey,onChange:e=>patch(d=>d.settings.firebaseApiKey=e.target.value)})))
 }
 const pages={home:h(Home),expenses:h(Expenses),wealth:h(Wealth),goals:h(Goals),reports:h(Reports),settings:h(Settings)};
 return h(React.Fragment,null,locked&&h("div",{className:"lock"},h("div",{className:"lockbox"},h("h2",null,"🔐 مالي V5"),h("p",{className:"muted"},"أدخل PIN"),h("input",{type:"password",inputMode:"numeric",value:pin,onChange:e=>setPin(e.target.value)}),h("button",{className:"primary",onClick:unlock},"فتح"))),h(Header),h("main",null,pages[page]),h(Nav))
}
ReactDOM.render(h(App),document.getElementById("root"));
