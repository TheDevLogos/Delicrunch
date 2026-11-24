const test=require('node:test'),assert=require('node:assert/strict'),express=require('express');
let stats,claims;const db=require.resolve('../db');require.cache[db]={id:db,filename:db,loaded:true,exports:{query:async(sql,args)=>{
 if(sql.includes('sales_xp'))return {rows:[stats]};if(sql.includes('INSERT INTO merchant_reward_claims')){if(claims.has(args[1]))return {rows:[]};claims.add(args[1]);return {rows:[{id:1}]};}return {rows:[]};}}};
const auth=(req,res,next)=>{req.user={id:23};next();};auth.restrictTo=()=>auth;
const authPath=require.resolve('../middleware/authMiddleware');require.cache[authPath]={id:authPath,filename:authPath,loaded:true,exports:auth};
const app=express();app.use(express.json());app.use('/merchant-rewards',require('../routes/merchantRewardRoutes'));
let server,base;test.before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}/merchant-rewards`;});test.after(()=>server.close());
test.beforeEach(()=>{stats={sales_xp:0,review_xp:0,packs:0,orders:0};claims=new Set();});
const claim=rewardId=>fetch(base+'/claims',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({rewardId})});
test('locked rewards cannot be claimed by changing the client level',async()=>{assert.equal((await claim('badge_first_sale')).status,403);assert.equal(claims.size,0);});
test('unknown benefits are rejected',async()=>assert.equal((await claim('invented-benefit')).status,400));
test('earned rewards are persisted once across retries',async()=>{stats.sales_xp=600;assert.equal((await claim('badge_first_sale')).status,201);assert.equal((await claim('badge_first_sale')).status,200);assert.equal(claims.size,1);});
