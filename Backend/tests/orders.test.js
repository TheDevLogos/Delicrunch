const test=require('node:test');const assert=require('node:assert/strict');
let role='comercio',order,owner='10',queries;
const client={query:async(sql,args)=>{queries.push([sql,args]);if(sql.includes('SELECT o.*'))return {rows:order?[order]:[]};if(sql.includes('SELECT user_id FROM stores'))return {rows:[{user_id:owner}]};if(sql.includes('UPDATE orders'))return {rows:[{...order,estado:args[0]}]};return {rows:[]};},release(){}};
const db=require.resolve('../db');require.cache[db]={id:db,filename:db,loaded:true,exports:{query:async()=>({rows:[{rol:role}]}),connect:async()=>client}};
const controller=require('../controllers/orderController');
async function update(body){let code=200,payload;const res={status(n){code=n;return this;},json(x){payload=x;return this;}};
 await controller.updateOrderStatus({params:{id:'7'},user:{id:10},body},res,e=>{throw e;});return {code,payload};}
test.beforeEach(()=>{role='comercio';owner='10';order={id:'7',user_id:'20',store_id:'3',estado:'confirmado',metodo_pago:'efectivo',codigo_recogida:'AB-12345'};queries=[];});
test('merchant ownership accepts PostgreSQL bigint IDs without leaking the private code',async()=>{const r=await update({estado:'en_preparacion'});assert.equal(r.code,200);assert.equal(r.payload.order.estado,'en_preparacion');assert.equal(r.payload.order.codigo_recogida,undefined);});
test('unrelated merchant cannot update another store order',async()=>{owner='11';assert.equal((await update({estado:'listo'})).code,403);assert.ok(!queries.some(([s])=>s.includes('UPDATE orders')));});
test('invalid pickup code rolls back before metrics or delivery',async()=>{assert.equal((await update({estado:'recogido',codigo_recogida:'WRONG'})).code,400);assert.ok(queries.some(([s])=>s==='ROLLBACK'));assert.ok(!queries.some(([s])=>s.includes('UPDATE orders')));});
test('explicit unpaid delivery is rejected',async()=>{assert.equal((await update({estado:'recogido',codigo_recogida:'AB-12345',pago_recibido:false})).code,400);});
test('terminal pickup cannot be repeated to credit XP twice',async()=>{order.estado='recogido';assert.equal((await update({estado:'recogido',codigo_recogida:'AB-12345'})).code,409);assert.ok(!queries.some(([s])=>s.includes('UPDATE profiles')));});
test('legacy online payments remain read-only',async()=>{order.metodo_pago='mercadopago';assert.equal((await update({estado:'listo'})).code,409);});
test('cancellation returns stock inside the transaction',async()=>{const r=await update({estado:'cancelado'});assert.equal(r.code,200);assert.ok(queries.some(([s])=>s.includes('cantidad_disponible + oi.cantidad')));assert.equal(queries.at(-1)[0],'COMMIT');});
test('retrying a reservation reuses its ticket before touching stock',async()=>{
 role='comprador';const original=client.query;
 client.query=async(sql,args)=>{queries.push([sql,args]);if(sql.includes('client_request_id'))return {rows:[{id:'71',codigo_recogida:'AB-12345',estado:'confirmado'}]};return {rows:[]};};
 try{let status,payload;const res={status(n){status=n;return this;},json(x){payload=x;return this;}};
 await controller.createOrder({user:{id:20},body:{productId:1,cantidad:1,requestId:'repeat_request_123'}},res,e=>{throw e;});
 assert.equal(status,200);assert.equal(payload.id,'71');assert.equal(payload.replayed,true);assert.ok(queries.some(([s])=>s.includes('pg_advisory_xact_lock')));assert.ok(!queries.some(([s])=>s.includes('UPDATE products')));
 }finally{client.query=original;}
});
