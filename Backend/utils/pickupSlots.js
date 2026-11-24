// All collection windows belong to Delicias, independent of the phone timezone.
const slotsSql=`SELECT slot AT TIME ZONE 'America/Chihuahua' AS pickup_at
 FROM products p JOIN stores s ON s.id=p.store_id
 CROSS JOIN generate_series(0,1) AS day_offset
 CROSS JOIN LATERAL generate_series(
   (NOW() AT TIME ZONE 'America/Chihuahua')::date + day_offset + COALESCE(p.hora_recogida_inicio,'14:00'::time),
   (NOW() AT TIME ZONE 'America/Chihuahua')::date + day_offset + COALESCE(p.hora_recogida_fin,'18:00'::time)
     + CASE WHEN COALESCE(p.hora_recogida_fin,'18:00'::time)<COALESCE(p.hora_recogida_inicio,'14:00'::time) THEN INTERVAL '1 day' ELSE INTERVAL '0 days' END,
   INTERVAL '15 minutes') AS slot
 WHERE p.id=$1 AND p.activo=true AND s.activo=true
 AND slot AT TIME ZONE 'America/Chihuahua'>NOW()+INTERVAL '5 minutes'
 ORDER BY pickup_at LIMIT 120`;
module.exports={slotsSql};
