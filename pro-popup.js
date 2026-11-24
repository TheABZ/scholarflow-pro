const $=id=>document.getElementById(id),result=$("result"),list=$("review");
const mappings=FIELDS.filter(([, , ,aliases])=>aliases.length).map(([key,label,,aliases])=>[key,label,"",aliases]);
let scan=null;
$("edit").onclick=()=>chrome.runtime.openOptionsPage();
$("dashboard").onclick=()=>chrome.tabs.create({url:chrome.runtime.getURL("dashboard.html")});
$("scan").onclick=async()=>{
 $("scan").disabled=true;$("preview").hidden=true;scan=null;result.textContent="Scanning…";list.replaceChildren();$("matches").replaceChildren();
 try{
  const {profile,profileVersion,learned={}}=await chrome.storage.local.get(["profile","profileVersion","learned"]);
  if(!profile||profileVersion!==2){result.textContent="Open Master profile, verify updated details, and save first.";return;}
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(!tab?.id||!/^https?:/.test(tab.url??""))throw Error();
  const origin=new URL(tab.url).origin,local=learned[origin]??{};
  const [{result:r}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:inspectApplication,args:[mappings,local]});
  scan={tabId:tab.id,url:tab.url,origin,profile,learned,local,rows:r.rows};
  result.textContent=`${r.rows.filter(x=>x.key&&profile[x.key]).length} suggested · ${r.existing} populated · ${r.reviews.length} manual items`;
  for(const row of r.rows){
   const box=document.createElement("div");box.className="match";
   const heading=document.createElement("strong");heading.textContent=(row.context?row.context+" / ":"")+row.caption+(row.required?" *":"");
   const select=document.createElement("select");select.dataset.index=row.index;
   const none=document.createElement("option");none.value="";none.textContent="Leave untouched";select.append(none);
   for(const [key,label] of mappings){if(!profile[key]||(row.refContext&&!/^ref\d/.test(key)))continue;const op=document.createElement("option");op.value=key;op.textContent=label;select.append(op);}
   if(row.key&&profile[row.key])select.value=row.key;
   const value=document.createElement("small");const update=()=>value.textContent=select.value?profile[select.value]:"Manual / skip";select.onchange=update;update();
   box.append(heading,select,value);$("matches").append(box);
  }
  for(const item of r.reviews){const li=document.createElement("li");li.textContent=item.caption+" — "+item.reason+(item.required?" (required)":"");list.append(li);}
  $("preview").hidden=r.rows.length===0;
 }catch{result.textContent="Could not scan this page. Open a normal application page and try again.";}
 finally{$("scan").disabled=false;}
};
$("fill").onclick=async()=>{
 if(!scan)return;$("fill").disabled=true;
 try{
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});if(tab.id!==scan.tabId||tab.url!==scan.url)throw Error("Page changed. Rescan.");
  const approved=[...$("matches").querySelectorAll("select")].filter(s=>s.value).map(s=>{const row=scan.rows.find(r=>r.index===Number(s.dataset.index));return {index:row.index,signature:row.signature,key:s.value,value:scan.profile[s.value]};});
  const [{result:r}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:inspectApplication,args:[mappings,scan.local,approved]});
  if($("remember").checked){const local={...scan.local};for(const a of approved)local[a.signature]=a.key;await chrome.storage.local.set({learned:{...scan.learned,[scan.origin]:local}});}
  result.textContent=`${r.filled} filled · ${approved.length-r.filled} not filled. Review the portal.`;$("preview").hidden=true;scan=null;
 }catch(e){result.textContent=e.message||"Fill failed; rescan.";}
 finally{$("fill").disabled=false;}
};
