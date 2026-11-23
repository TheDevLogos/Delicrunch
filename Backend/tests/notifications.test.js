const test=require('node:test');const assert=require('node:assert/strict');
const express=require('express');
let query;
const db=require.resolve('../db');require.cache[db]={id:db,filename:db,loaded:true,exports:{query:(...args)=>query(...args)}};
const auth=require.resolve('../middleware/authMiddleware');require.cache[auth]={id:auth,filename:auth,loaded:true,exports:(req,res,next)=>{if(!req.headers['x-test-user'])return res.sendStatus(401);req.user={id:req.headers['x-test-user']};next();}};
const app=express();app.use(express.json());app.use('/api/notifications',require('../routes/notificationRoutes'));
let server,base;
test.before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/api/notifications`;});
test.after(()=>server.close());
test('inbox requires a session',async()=>{assert.equal((await fetch(base)).status,401);});
test('all personas only read their own inbox and unread count',async()=>{
 for(const id of ['buyer','merchant','admin']){
  query=async(sql,args)=>{assert.equal(args[0],id);return sql.includes('COUNT')?{rows:[{count:1}]}:{rows:[{id:7,titulo:'Aviso'}]};};
  const r=await fetch(base,{headers:{'x-test-user':id}});assert.equal(r.status,200);assert.equal((await r.json()).unread,1);
 }
});
test('another user cannot mark a notice as read',async()=>{
 query=async(sql,args)=>{assert.deepEqual(args,['42','buyer']);assert.match(sql,/user_id=\$2/);return {rowCount:0};};
 const r=await fetch(base+'/42/read',{method:'PATCH',headers:{'x-test-user':'buyer'}});assert.equal(r.status,404);
});
test('read-all is bounded to the highest visible notice',async()=>{
 query=async(sql,args)=>{assert.match(sql,/id<=\$2/);assert.deepEqual(args,['buyer','50']);return {rowCount:2};};
 const r=await fetch(base+'/read-all',{method:'PATCH',headers:{'x-test-user':'buyer','content-type':'application/json'},body:JSON.stringify({throughId:'50'})});assert.equal(r.status,200);
});
test('invalid cursors and IDs are rejected before querying',async()=>{
 query=async()=>{throw Error('must not query');};
 assert.equal((await fetch(base+'?before=bad',{headers:{'x-test-user':'buyer'}})).status,400);
 assert.equal((await fetch(base+'/bad/read',{method:'PATCH',headers:{'x-test-user':'buyer'}})).status,400);
});
