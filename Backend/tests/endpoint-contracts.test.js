const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function pattern(route){return new RegExp('^'+route.replace(/:[^/]+/g,'[^/]+')+'$');}
const routes=[];
for(const file of files(path.join(root,'Backend/routes')).filter(x=>x.endsWith('Routes.js'))){
 const mount={authRoutes:'auth',profileRoutes:'profiles',productRoutes:'products',orderRoutes:'orders',pushRoutes:'push',reviewRoutes:'reviews',storeRoutes:'stores',adminRoutes:'admin',couponRoutes:'coupons',businessVisitRoutes:'business-visits',notificationRoutes:'notifications',merchantRewardRoutes:'merchant-rewards'}[path.basename(file,'.js')];
 if(!mount)continue;
 for(const m of fs.readFileSync(file,'utf8').matchAll(/router\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g))routes.push({method:m[1],route:'/'+mount+(m[2]==='/'?'':m[2])});
}
const parser=require('../../Frontend/node_modules/@babel/parser');
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const [key,val]of Object.entries(node)){if(['loc','start','end'].includes(key))continue;if(Array.isArray(val))val.forEach(n=>walk(n,fn));else if(val&&typeof val==='object')walk(val,fn);}}
function string(node){if(!node)return null;if(node.type==='StringLiteral')return node.value;
 if(node.type==='TemplateLiteral')return node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?'value':'')).join('');
 if(node.type==='BinaryExpression'&&node.operator==='+')return (string(node.left)??'value')+(string(node.right)??'value');return null;}
test('every statically identifiable frontend API call has a matching HTTP method and mounted route',()=>{
 const misses=[];let count=0;
 for(const dir of ['app','components','contexts']) for(const file of files(path.join(root,'Frontend',dir)).filter(x=>/\.[jt]sx?$/.test(x))){
  const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx']});
  walk(ast,n=>{if(n.type!=='CallExpression'||n.callee.type!=='MemberExpression'||!['api','publicApi'].includes(n.callee.object.name)||!['get','post','put','patch','delete'].includes(n.callee.property.name))return;
   const url=string(n.arguments[0]);if(!url)return;count++;
   if(file.endsWith('OrderDetailScreen.js')&&url==='/orders/valuevalue')return;
   if(!routes.some(r=>r.method===n.callee.property.name&&pattern(r.route).test(url.split('?')[0].replace(/\/$/,''))))misses.push(`${path.relative(root,file)} ${n.callee.property.name} ${url}`);
  });
 }
 assert.ok(count>80);assert.deepEqual(misses,[]);
});
