const router=require('express').Router();const pool=require('../db');
const protect=require('../middleware/authMiddleware');const asyncHandler=require('../middleware/asyncHandler');
const definitions=require('../config/merchantRewards.json');
async function merchantXP(userId){
 const result=await pool.query(`SELECT COALESCE(SUM(FLOOR(o.total/10)+packs.quantity*10),0) AS sales_xp,
   COALESCE(SUM(CASE WHEN rating.value>=5 THEN 50 WHEN rating.value>=4 THEN 25 ELSE 0 END),0) AS review_xp,
   COALESCE(SUM(packs.quantity),0) AS packs,COUNT(*) AS orders
 FROM orders o JOIN stores s ON s.id=o.store_id
 JOIN LATERAL(SELECT COALESCE(SUM(cantidad),0) AS quantity FROM order_items WHERE order_id=o.id) packs ON true
 LEFT JOIN LATERAL(SELECT MAX(calificacion) AS value FROM reviews WHERE order_id=o.id AND visible=true) rating ON true
 WHERE s.user_id=$1 AND o.estado='recogido'`,[userId]);
 const row=result.rows[0];const xp=Number(row.sales_xp)+Number(row.review_xp);
 const level=[...definitions.levels].reverse().find(l=>xp>=l.xpRequired)?.level||1;
 return {xp,level,packs:Number(row.packs),orders:Number(row.orders)};
}
router.use(protect);
router.get('/',asyncHandler(async(req,res)=>{
 const stats=await merchantXP(req.user.id);const claims=await pool.query('SELECT reward_id,status,created_at FROM merchant_reward_claims WHERE user_id=$1',[req.user.id]);
 res.json({...stats,claims:claims.rows});
}));
router.post('/claims',asyncHandler(async(req,res)=>{
 const group=definitions.rewards.find(g=>g.rewards.some(r=>r.id===req.body.rewardId));
 if(!group)return res.status(400).json({msg:'Recompensa no válida.'});
 const stats=await merchantXP(req.user.id);
 if(stats.level<group.level)return res.status(403).json({msg:'Aún no alcanzas el nivel de esta recompensa.'});
 const result=await pool.query(`INSERT INTO merchant_reward_claims(user_id,reward_id) VALUES($1,$2) ON CONFLICT(user_id,reward_id) DO NOTHING RETURNING id`,[req.user.id,req.body.rewardId]);
 if(result.rows.length)await pool.query(`INSERT INTO notifications(user_id,tipo,titulo,mensaje,data,event_key)
 SELECT id,'recompensa','Solicitud de recompensa','Un comercio solicitó una recompensa desbloqueada.',jsonb_build_object('type','merchant_reward','claimId',$1::text),'merchant-claim:'||$1::text FROM users WHERE rol='admin' ON CONFLICT(user_id,event_key) DO NOTHING`,[result.rows[0].id]);
 res.status(result.rows.length?201:200).json({status:'requested'});
}));
module.exports=router;module.exports.merchantXP=merchantXP;
router.get('/claims',protect.restrictTo('admin'),asyncHandler(async(req,res)=>{
 const result=await pool.query(`SELECT c.id,c.reward_id,c.status,c.created_at,u.nombre,s.nombre_comercio FROM merchant_reward_claims c JOIN users u ON u.id=c.user_id LEFT JOIN stores s ON s.user_id=c.user_id ORDER BY c.created_at DESC LIMIT 200`);res.json(result.rows);
}));
router.patch('/claims/:id',protect.restrictTo('admin'),asyncHandler(async(req,res)=>{
 if(!/^\d+$/.test(req.params.id)||!['requested','fulfilled','rejected'].includes(req.body.status))return res.status(400).json({msg:'Solicitud inválida.'});
 const result=await pool.query('UPDATE merchant_reward_claims SET status=$2 WHERE id=$1 AND status IS DISTINCT FROM $2 RETURNING *',[req.params.id,req.body.status]);
 const claim=result.rows[0];if(claim)await pool.query(`INSERT INTO notifications(user_id,tipo,titulo,mensaje,data,event_key) VALUES($1,'recompensa','Recompensa actualizada',$2,'{"type":"merchant_rewards"}'::jsonb,$3) ON CONFLICT(user_id,event_key) DO NOTHING`,[claim.user_id,req.body.status==='fulfilled'?'Administración confirmó la entrega de tu beneficio.':req.body.status==='rejected'?'Administración revisó tu solicitud. Consulta el estado de tus recompensas.':'Tu solicitud está en revisión.','claim-status:'+claim.id+':'+req.body.status]);
 res.json({ok:true});
}));
