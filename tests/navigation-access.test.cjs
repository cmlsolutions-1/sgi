const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), ts = require('typescript')
const root = path.resolve(__dirname, '..')
let response, calls=[]
function load(file, cache=new Map()) {
  const absolute=path.resolve(root,file)
  if(cache.has(absolute))return cache.get(absolute).exports
  const module={exports:{}};cache.set(absolute,module)
  const source=ts.transpileModule(fs.readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText
  new Function('require','module','exports',source)(name=>{
    if(name==='@/lib/apiClient')return {apiFetch:async(url,options)=>{calls.push({url,options});return response}}
    if(!name.startsWith('.')&&!name.startsWith('@/'))return require(name)
    const base=name.startsWith('@/')?path.resolve(root,name.slice(2)):path.resolve(path.dirname(absolute),name)
    const target=['','.ts','.tsx'].map(ext=>base+ext).find(file=>fs.existsSync(file)&&fs.statSync(file).isFile())
    return load(path.relative(root,target),cache)
  },module,module.exports)
  return module.exports
}
async function run(){
 const nav=load('components/dashboard/navigation.tsx')
 const paths=modules=>nav.filterNavigationByModules(nav.navigation,modules).flatMap(item=>item.subItems?.map(child=>child.href)??[item.href])
 assert.deepEqual(paths([]),['/dashboard'])
 for(const parent of nav.navigation.filter(item=>item.subItems)){
  assert.deepEqual(paths([{id:parent.code,code:parent.code,parentId:null,children:[]}]),['/dashboard'],parent.code+' alone must not grant children')
  for(const child of parent.subItems.filter(child=>child.code!==parent.code)){
   const modules=[{id:parent.code,code:parent.code,parentId:null,children:[{id:child.code,code:child.code,parentId:parent.code}]}]
   const visible=paths(modules)
   assert.ok(visible.includes(child.href),child.code+' is explicitly authorized')
   for(const sibling of parent.subItems.filter(sibling=>sibling.code!==child.code&&sibling.code!==parent.code))assert.ok(!visible.includes(sibling.href),'No sibling grant: '+sibling.code)
   assert.equal(nav.isDashboardPathAllowed(child.href,modules),true)
  }
 }
 const employeeOnly=[{id:'employee',code:'EMPLOYEE',parentId:null,children:[{id:'management',code:'EMPLOYEE_MANAGEMENT',parentId:'employee'}]}]
 assert.deepEqual(paths(employeeOnly),['/dashboard','/dashboard/employees'])
 assert.equal(nav.isDashboardPathAllowed('/dashboard/custody',employeeOnly),false)
 assert.equal(nav.isDashboardPathAllowed('/dashboard/employees/123',employeeOnly),true)
 const riskLabor=[{id:'risks',code:'RISKS',parentId:null,children:[{id:'labor',code:'LABOR',parentId:'risks'}]}]
 assert.ok(!paths(riskLabor).includes('/dashboard/incidents'),'Risk LABOR must not grant employee INCIDENTS')
 assert.ok(paths(riskLabor).includes('/dashboard/occupational'))
 assert.ok(paths([{id:'employee',code:'EMPLOYEE',parentId:null,children:[]},{id:'jobs',code:'JOBS',parentId:'employee'}]).includes('/dashboard/jobs'),'Flat explicit child grants are supported')
 const service=load('services/modulesService.ts')
 response=Response.json({ok:true,data:employeeOnly})
 assert.deepEqual(await service.getMyModules(),employeeOnly)
 assert.equal(calls[0].options.cache,'no-store')
 response=Response.json({ok:false,message:'Acceso no autorizado',data:employeeOnly})
 await assert.rejects(()=>service.getMyModules(),/Acceso no autorizado/)
 response=Response.json({ok:true,data:{items:employeeOnly}})
 await assert.rejects(()=>service.getMyModules(),/No se pudo cargar/)
 console.log('Navigation checks passed: explicit child grants, no parent inheritance, no mock exceptions, no LABOR/INCIDENTS leakage, flat responses, route checks and uncached module requests')
}
run().catch(error=>{console.error(error);process.exitCode=1})
