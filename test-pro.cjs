const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
class Input{
 constructor(name,type="text",value="",label=name,context=""){Object.assign(this,{name,type,_value:value,labels:[{innerText:label}],tagName:"INPUT",maxLength:-1,events:[],context,required:true});}
 get value(){return this._value}set value(v){this._value=v}
 getAttribute(k){return k==="name"?this.name:k==="autocomplete"?this.auto:null}
 getClientRects(){return [1]}closest(){return this.context?{querySelector:()=>({innerText:this.context})}:null}
 checkValidity(){return true}dispatchEvent(e){this.events.push(e.type)}
}
class Select extends Input{constructor(){super("nationality","select-one","","Nationality");this.tagName="SELECT";this.options=[{text:"Nigeria",value:"NG"},{text:"Ghana",value:"GH"}];this.selectedOptions=[];}get value(){return this._value}set value(v){this._value=v}}
const inputs=[new Input("firstName","text","","Given name *"),new Input("surname","text","Existing"),new Input("email","email","","Email","Referee 1"),new Select(),new Input("doc","file","","Upload CV"),new Input("essay","textarea","","Motivation letter"),new Input("mystery","text","","Candidate identifier"),new Input("dob","date"),new Input("password","password"),new Input("consent","checkbox")];
const ctx=vm.createContext({document:{querySelectorAll:()=>inputs,getElementById:()=>null},getComputedStyle:()=>({visibility:"visible"}),HTMLInputElement:Input,HTMLSelectElement:Select,HTMLTextAreaElement:Input,Event:class{constructor(type){this.type=type}}});
for(const file of ["schema.js","pro-engine.js"])vm.runInContext(fs.readFileSync(path.join(__dirname,file),"utf8"),ctx);
const run=s=>vm.runInContext(s,ctx);
const r=run("inspectApplication(FIELDS, {})");
assert.equal(r.rows.find(x=>x.index===0).key,"firstName");assert.equal(r.rows.find(x=>x.index===2).key,"");assert.equal(r.existing,1);assert.equal(inputs[0].value,"");
assert.ok(r.reviews.some(x=>x.reason==="Manual document upload"));assert.ok(r.reviews.some(x=>x.caption==="Motivation letter"));
const sample={firstName:"Alex",nationality:"Nigerian",dob:"1996-02-20"};
ctx.approved=r.rows.filter(x=>x.key).map(x=>({...x,value:sample[x.key]}));
const fill=run("inspectApplication(FIELDS, {}, approved)");assert.equal(fill.filled,3);assert.equal(inputs[0].value,"Alex");assert.equal(inputs[3].value,"NG");assert.equal(inputs[7].value,"1996-02-20");assert.equal(inputs[1].value,"Existing");assert.equal(inputs[2].value,"");
ctx.learned={[r.rows.find(x=>x.index===6).signature]:"matric"};assert.equal(run("inspectApplication(FIELDS,learned)").rows.find(x=>x.index===6).key,"matric");
assert.ok(Object.values(run("initialProfile")).every(value => value === ""));
console.log("PASS: preview without writes, exact aliases, explicit approval, nationality dropdown, DOB, existing value preservation, referee context, manual uploads/essays, learned mapping and empty initial profile.");
