// Review first. Only selected values are written; no submission.
function inspectApplication(mappings, learned, approved=null) {
 const norm=s=>String(s??"").replace(/([a-z])([A-Z])/g,"$1 $2").toLowerCase().replace(/[^a-z0-9]+/g," ").replace(/\b(required|optional)\b/g,"").trim().replace(/\s+/g," ");
 const aliases=new Map();
 for(const [key,,,words] of mappings)for(const word of words){const n=norm(word);if(!aliases.has(n))aliases.set(n,new Set());aliases.get(n).add(key);}
 const auto={"given-name":"firstName","additional-name":"middleName","family-name":"lastName","name":"fullName","email":"email","tel":"phone","bday":"dob","postal-code":"postal","address-line1":"address","address-level2":"city","address-level1":"state","country-name":"country","honorific-prefix":"title"};
 const blocked=/password|captcha|verification|security question|signature|consent|declaration|passport|national id|bank|payment|credit card|essay|statement of purpose|motivation|agreement|certify|submit|login|sign in|username|recommendation letter/i;
 const rows=[], reviews=[];let existing=0,filled=0,failed=0;
 for(const [index,el] of [...document.querySelectorAll("input,select,textarea")].entries()){
  if(el.disabled||el.readOnly||!el.getClientRects().length||getComputedStyle(el).visibility==="hidden")continue;
  const label=[...(el.labels??[])].map(l=>l.innerText).join(" ");
  const aria=[el.getAttribute("aria-label"),...(el.getAttribute("aria-labelledby")??"").split(/\s+/).map(id=>document.getElementById(id)?.innerText)].filter(Boolean).join(" ");
  const context=el.closest("fieldset")?.querySelector("legend")?.innerText??"";
  const names=[label,aria,el.getAttribute("name"),el.id,el.placeholder].filter(Boolean),caption=names[0]||"Unlabelled field";
  if(el.type==="file"){reviews.push({caption,reason:"Manual document upload",required:el.required});continue;}
  if(!["text","email","tel","url","number","date","select-one","textarea","search"].includes(el.type)){if(el.required&&!el.checked&&el.type!=="hidden")reviews.push({caption,reason:"Manual choice or declaration",required:true});continue;}
  if(blocked.test([...names,context].join(" "))){reviews.push({caption,reason:"Manual response",required:el.required});continue;}
  if(el.value&&!(el.tagName==="SELECT"&&el.selectedOptions[0]?.disabled)){existing++;continue;}
  const signature=JSON.stringify([norm(context),...names.map(norm),el.type]);
  const keys=new Set(names.flatMap(name=>[...(aliases.get(norm(name))??[])]));
  const ac=(el.getAttribute("autocomplete")??"").split(/\s+/).pop();if(auto[ac])keys.add(auto[ac]);
  const refContext=/referee|reference|recommender|ref[0-9]/i.test([...names,context].join(" "));
  if(refContext)for(const key of [...keys])if(!/^ref\d/.test(key))keys.delete(key);
  let key=keys.size===1?[...keys][0]:"";const mapped=learned[signature];
  if(mapped&&mappings.some(m=>m[0]===mapped))key=mapped;
  if(refContext&&!/^ref\d/.test(key))key="";if(!names.length)key="";
  if(approved===null){rows.push({index,signature,caption,context,key,required:el.required,kind:el.type,refContext});continue;}
  const decision=approved.find(a=>a.index===index&&a.signature===signature);if(!decision)continue;
  if(refContext&&!/^ref\d/.test(decision.key)){failed++;continue;}
  let target=decision.value;
  if(typeof target!=="string"||!target.trim()){failed++;continue;}
  if(el.type==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)){failed++;continue;}
  if(el.type==="date"&&!/^\d{4}-\d{2}-\d{2}$/.test(target)){failed++;continue;}
  if(el.tagName==="SELECT"){
   const variants=[target];if(target==="Nigerian")variants.push("Nigeria","NG");if(target==="Nigeria")variants.push("NG","Nigerian");
   const options=[...el.options].filter(o=>!o.disabled&&variants.some(v=>norm(o.text)===norm(v)||norm(o.value)===norm(v)));
   if(options.length!==1){failed++;continue;}target=options[0].value;
  }
  if(el.maxLength>=0&&target.length>el.maxLength){failed++;continue;}
  const proto=el.tagName==="SELECT"?HTMLSelectElement.prototype:el.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const set=Object.getOwnPropertyDescriptor(proto,"value").set,old=el.value;set.call(el,target);
  if(!el.checkValidity()||el.value!==target){set.call(el,old);failed++;continue;}
  el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));if(el.value===target)filled++;else failed++;
 }
 return {rows,reviews,existing,filled,failed};
}
