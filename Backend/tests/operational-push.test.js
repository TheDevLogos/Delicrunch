const test=require('node:test');const assert=require('node:assert/strict');
let queries,devices,notice,ticket;
const db=require.resolve('../db');require.cache[db]={id:db,filename:db,loaded:true,exports:{query:async(sql,args)=>{queries.push([sql,args]);if(sql.includes('RETURNING id,user_id'))return {rows:[notice]};if(sql.includes('SELECT id,expo_push_token'))return {rows:devices};return {rows:[]};}}};
const {drainNotifications}=require('../services/operationalPush');
test.beforeEach(()=>{queries=[];devices=[{id:1,expo_push_token:'ExpoPushToken[test-device-only]'}];notice={id:1,user_id:2,titulo:'Test',mensaje:'Test',data:{type:'buyer_order',orderId:7},push_attempts:1};global.fetch=async(url,opts)=>{assert.ok(!opts.body.includes('codigo_recogida'));return {ok:true,json:async()=>({data:[ticket]})};};ticket={status:'ok',id:'test-ticket'};});
test('accepted notices are marked sent after provider acceptance',async()=>{await drainNotifications();assert.ok(queries.some(([s])=>s.includes("push_status='sent'")));});
test('missing devices do not drop the inbox notification',async()=>{devices=[];await drainNotifications();assert.ok(queries.some(([s])=>s.includes("push_status='no_device'")));assert.ok(!queries.some(([s])=>/DELETE/i.test(s)));});
test('unregistered devices are disabled',async()=>{ticket={status:'error',details:{error:'DeviceNotRegistered'}};await drainNotifications();assert.ok(queries.some(([s])=>s.includes('disabled_at=NOW()')));});
test('temporary provider failures remain retryable',async()=>{ticket={status:'error',message:'Provider unavailable'};await drainNotifications();const retry=queries.find(([s])=>s.includes('push_status=$2'));assert.equal(retry[1][1],'pending');});
