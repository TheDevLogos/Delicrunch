const pool = require('../db');
let running = false;
// The durable inbox is committed with the operation. Push is a best-effort,
// leased outbox: provider downtime never rolls back a reservation or delivery.
async function drainNotifications() {
  if (running) return;
  running = true;
  try {
    await pool.query("UPDATE notifications SET push_status='failed',push_error='Intentos agotados tras interrupción',push_updated_at=NOW() WHERE push_status='sending' AND push_attempts>=4 AND push_updated_at<NOW()-INTERVAL '2 minutes'");
    const batch = await pool.query(`UPDATE notifications SET push_status='sending', push_attempts=push_attempts+1, push_updated_at=NOW()
      WHERE id IN (SELECT id FROM notifications WHERE
        (push_status='pending' OR (push_status='sending' AND push_updated_at<NOW()-INTERVAL '2 minutes'))
        AND push_attempts<4 AND (push_updated_at IS NULL OR push_updated_at<NOW()-INTERVAL '30 seconds')
        ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 30)
      RETURNING id,user_id,titulo,mensaje,data,push_attempts`);
    for (const notice of batch.rows) {
      try {
        const devices = await pool.query('SELECT id,expo_push_token FROM push_devices WHERE user_id=$1 AND disabled_at IS NULL', [notice.user_id]);
        if (!devices.rows.length) {
          await pool.query("UPDATE notifications SET push_status='no_device',push_updated_at=NOW() WHERE id=$1", [notice.id]);
          continue;
        }
        for (let offset=0; offset<devices.rows.length; offset+=100) {
          const chunk=devices.rows.slice(offset,offset+100);
          const response=await fetch('https://exp.host/--/api/v2/push/send', {
            method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
            signal:AbortSignal.timeout(12000),
            body:JSON.stringify(chunk.map(d=>({to:d.expo_push_token,title:notice.titulo,body:notice.mensaje,
              sound:'default',channelId:'orders',priority:'high',data:{...notice.data,notificationId:String(notice.id)}}))),
          });
          if (!response.ok) throw Error(`Expo ${response.status}`);
          const body=await response.json();
          const tickets=Array.isArray(body.data)?body.data:[body.data];
          let retry=false;
          for(let i=0;i<chunk.length;i++) {
            if(tickets[i]?.details?.error==='DeviceNotRegistered') {
              await pool.query('UPDATE push_devices SET disabled_at=NOW() WHERE id=$1',[chunk[i].id]);
            } else if(tickets[i]?.status!=='ok') retry=true;
          }
          if(retry) throw Error('Expo no aceptó todos los avisos');
        }
        await pool.query("UPDATE notifications SET push_status='sent',push_error=NULL,push_updated_at=NOW() WHERE id=$1",[notice.id]);
      } catch(error) {
        await pool.query("UPDATE notifications SET push_status=$2,push_error=$3,push_updated_at=NOW() WHERE id=$1",[notice.id,notice.push_attempts>=4?'failed':'pending',String(error.message).slice(0,200)]);
      }
    }
  } finally { running=false; }
}
function startOperationalPush() {
  const drain=()=>drainNotifications().catch(e=>console.error('Error procesando avisos:',e.message));
  const timer=setInterval(drain,15000);timer.unref();drain();return timer;
}
module.exports={drainNotifications,startOperationalPush};
