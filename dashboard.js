const $=id=>document.getElementById(id), app=$("application"), ans=$("answer");
const docs=["Academic CV","Degree attestation","Official transcript","Unofficial results","WASSCE certificate","English MOI certificate","Research proposal","Motivation letter","Reference letters","Passport (upload manually if required)"];
const eligibility=["Eligible nationality / residence","Minimum degree and GPA equivalence","Required field of study","English language evidence accepted","Academic documents accepted","Funding and fee conditions","Application deadline still open"];
let state={applications:[],answers:[],documents:{},checks:{}};let editing=null;
const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
const button=(text,fn)=>{const b=node("button",text);b.type="button";b.className="secondary";b.onclick=fn;return b;};
const val=form=>Object.fromEntries(new FormData(form));
const key=s=>String(s??"").trim().toLowerCase().replace(/\s+/g," ");
const appKey=a=>[a.institution,a.programme,a.intake].map(key).join("|");
const save=()=>chrome.storage.local.set({dashboardState:state});
const msg=t=>$("message").textContent=t;
async function copy(text){try{await navigator.clipboard.writeText(text);msg("Copied to clipboard.");}catch{msg("Copy unavailable. Select the text manually.");}}
function link(raw){try{const u=new URL(raw);return u.protocol==="https:"||u.protocol==="http:"?u.href:null;}catch{return null;}}
function render(){
 $("stats").textContent=`${state.applications.length} tracked · ${state.applications.filter(a=>a.status==="Submitted").length} submitted · ${state.applications.filter(a=>a.status==="Started").length} started`;
 $("applications").replaceChildren();
 const today=new Date().toISOString().slice(0,10);
 for(const a of [...state.applications].sort((a,b)=>(a.deadline||"9999").localeCompare(b.deadline||"9999"))){
  const box=node("article");box.className="record";box.append(node("h3",a.programme+" — "+a.institution),node("p",a.status+" | "+(a.intake||"Intake unspecified")+" | "+(a.deadline?(a.deadline<today?"Past deadline: ":"Deadline: ")+a.deadline:"No deadline recorded")),node("p",a.notes||""));
  if(link(a.url)){const l=node("a","Open portal");l.href=link(a.url);l.target="_blank";l.rel="noopener";box.append(l);}
  box.append(button("Edit",()=>{editing=a.id;for(const [k,v] of Object.entries(a))if(app.elements.namedItem(k))app.elements.namedItem(k).value=v??"";app.scrollIntoView({behavior:"smooth"});}),button("Remove",async()=>{if(confirm("Remove this application from your tracker?")){state.applications=state.applications.filter(x=>x.id!==a.id);await save();render();}}));$("applications").append(box);
 }
 $("answers").replaceChildren();
 for(const [i,a] of state.answers.entries()){const box=node("article");box.className="record";box.append(node("h3",a.question),node("p",a.answer),button("Copy answer",()=>copy(a.answer)),button("Remove",async()=>{if(confirm("Remove saved answer?")){state.answers.splice(i,1);await save();render();}}));$("answers").append(box);}
 $("documents").replaceChildren();
 for(const name of docs){const row=node("div");row.className="docrow";const label=node("label",name),cb=node("input");cb.type="checkbox";cb.checked=Boolean(state.documents[name]?.ready);label.prepend(cb);const input=node("input");input.placeholder="Optional Drive link";input.value=state.documents[name]?.url??"";input.type="url";const store=async()=>{state.documents[name]={ready:cb.checked,url:input.value};await save();};cb.onchange=store;input.onchange=store;row.append(label,input);$("documents").append(row);}
 $("eligibility").replaceChildren();for(const name of eligibility){const label=node("label",name),cb=node("input");label.className="inline";cb.type="checkbox";cb.checked=Boolean(state.checks[name]);cb.onchange=async()=>{state.checks[name]=cb.checked;await save();};label.prepend(cb);$("eligibility").append(label);}
}
app.onsubmit=async e=>{e.preventDefault();const a=val(app);if(state.applications.some(x=>x.id!==editing&&appKey(x)===appKey(a))){$("appStatus").textContent="Possible duplicate: same institution, programme and intake. Edit the existing record.";return;}if(a.url&&!link(a.url)){$("appStatus").textContent="Use a valid HTTP(S) portal URL.";return;}if(editing)state.applications=state.applications.map(x=>x.id===editing?{...a,id:editing}:x);else state.applications.push({...a,id:crypto.randomUUID()});await save();editing=null;app.reset();$("appStatus").textContent="Application saved.";render();};
$("cancel").onclick=()=>{editing=null;app.reset();$("appStatus").textContent="";};
ans.onsubmit=async e=>{e.preventDefault();const a=val(ans);const i=state.answers.findIndex(x=>key(x.question)===key(a.question));if(i>=0)state.answers[i]=a;else state.answers.push(a);await save();ans.reset();render();};
$("promptForm").onsubmit=async e=>{e.preventDefault();const a=val(e.target),{profile,profileVersion}=await chrome.storage.local.get(["profile","profileVersion"]);if(profileVersion!==2){$("prompt").value="Please verify and save your master profile first.";return;}const fields=["degree","university","cgpa","scale","classification","finalGpa","thesis","researchInterests","skills","experience","awards","leadership","englishQualification","englishMoi","languageLevel","testTaken"];const facts=fields.map(k=>FIELDS.find(f=>f[0]===k)?.[1]+": "+(profile[k]??"")).join("\n");$("prompt").value=`Write a tailored ${a.type} for ${a.programme}.${a.limit?" Maximum "+a.limit+" words.":""}\nExact programme requirements: ${a.requirements}\nUse only confirmed facts below. Do not invent publications, test scores, experience, or programme details. Flag missing information. Write in my natural professional voice and provide a draft for my review.\n\n${facts}`;};
$("copyPrompt").onclick=()=>copy($("prompt").value);
$("backup").onclick=async()=>{const data=await chrome.storage.local.get(["profile","profileVersion","learned","dashboardState"]);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=node("a");a.href=url;a.download="scholarflow-pro-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$("restore").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());const d=data.dashboardState;if(!d||!Array.isArray(d.applications)||!Array.isArray(d.answers)||!d.documents||!d.checks)throw Error();if(!confirm("Replace the local dashboard with this backup?"))return;state={applications:d.applications.filter(a=>a&&typeof a.id==="string"&&typeof a.institution==="string"&&typeof a.programme==="string"),answers:d.answers.filter(a=>a&&typeof a.question==="string"&&typeof a.answer==="string"),documents:d.documents,checks:d.checks};await save();render();msg("Dashboard restored. Profile backups can be imported in Master profile.");}catch{msg("Invalid backup.");}};
$("forget").onclick=async()=>{if(confirm("Forget all learned website mappings?")){await chrome.storage.local.set({learned:{}});msg("Learned mappings cleared.");}};
chrome.storage.local.get("dashboardState").then(({dashboardState})=>{if(dashboardState)state=dashboardState;render();}).catch(()=>msg("Could not load dashboard."));
