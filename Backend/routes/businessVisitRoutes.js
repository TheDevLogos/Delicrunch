const router = require('express').Router();
const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const limits = { business_name:120, contact_name:100, phone:30, email:160, address:250, city:80, preferred_time:160, notes:1000 };
router.post('/', asyncHandler(async (req,res) => {
  const data = {};
  for (const [key,max] of Object.entries(limits)) {
    if (req.body[key] != null && typeof req.body[key] !== 'string') return res.status(400).json({message:'Datos inválidos.'});
    data[key] = (req.body[key] || '').trim();
    if (data[key].length > max) return res.status(400).json({message:'Revisa la longitud de los campos.'});
  }
  if (!['business_name','contact_name','phone','address','city'].every(k=>data[k]) || !/^[+\d ()-]{10,30}$/.test(data.phone) || data.phone.replace(/\D/g,'').length < 10 || (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) || req.body.consent !== true) {
    return res.status(400).json({message:'Completa los datos de contacto y autoriza que te contactemos.'});
  }
  // Prevent rapid duplicate requests without retaining visitor IP addresses.
  const existing = await pool.query("SELECT id FROM business_visit_requests WHERE phone=$1 AND business_name=$2 AND created_at > NOW()-INTERVAL '5 minutes'",[data.phone,data.business_name]);
  if (existing.rowCount) return res.status(429).json({message:'Ya recibimos tu solicitud. Espera unos minutos antes de enviar otra.'});
  const fields=Object.keys(limits);
  await pool.query(`INSERT INTO business_visit_requests (${fields.join(',')}) VALUES (${fields.map((_,i)=>'$'+(i+1)).join(',')})`,fields.map(k=>data[k]));
  res.status(201).json({message:'Recibimos tu solicitud. Te contactaremos para acordar la visita.'});
}));
router.get('/',protect,restrictTo('admin'),asyncHandler(async(req,res)=>{
  const result=await pool.query('SELECT * FROM business_visit_requests ORDER BY created_at DESC LIMIT 200');
  const count=await pool.query("SELECT COUNT(*)::int AS count FROM business_visit_requests WHERE status='pending'");
  res.json({requests:result.rows,pending:count.rows[0].count});
}));
router.patch('/:id',protect,restrictTo('admin'),asyncHandler(async(req,res)=>{
  if (!/^\d+$/.test(req.params.id) || !['pending','contacted','scheduled','closed'].includes(req.body.status)) return res.status(400).json({message:'Estado inválido.'});
  const result=await pool.query('UPDATE business_visit_requests SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *',[req.body.status,req.params.id]);
  if (!result.rowCount) return res.status(404).json({message:'Solicitud no encontrada.'});
  res.json(result.rows[0]);
}));
module.exports=router;
