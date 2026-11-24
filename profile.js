const form=document.querySelector("#profile"), grid=document.querySelector("#fields"), status=document.querySelector("#status");
for(const [key,label] of FIELDS){
  const wrap=document.createElement("label"), input=document.createElement("input");
  wrap.textContent=label; input.name=key; input.type=key==="dob"||key.endsWith("Date")||["secondaryStart","secondaryEnd"].includes(key)?"date":"text"; input.autocomplete="off"; wrap.append(input); grid.append(wrap);
}
const snapshot=()=>Object.fromEntries(FIELDS.map(([key])=>[key,form.elements.namedItem(key).value.trim()]));
function show(profile){for(const [key] of FIELDS)form.elements.namedItem(key).value=typeof profile[key]==="string"?profile[key]:"";}
chrome.storage.local.get("profile").then(({profile}) => show({...initialProfile, ...profile})).catch(()=>status.textContent="Profile could not load.");
form.addEventListener("submit",async e=>{e.preventDefault();try{await chrome.storage.local.set({profile:snapshot(),profileVersion:2});status.textContent="Saved. You can now fill applications.";}catch{status.textContent="Save failed.";}});
document.querySelector("#export").onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="scholarflow-profile.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.querySelector("#import").onchange=async e=>{try{const parsed=JSON.parse(await e.target.files[0].text());if(!parsed||Array.isArray(parsed)||typeof parsed!=="object")throw Error();show(parsed);status.textContent="Imported into editor. Review and save.";}catch{status.textContent="Invalid profile JSON.";}};
