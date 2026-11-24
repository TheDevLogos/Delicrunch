import * as Notifications from 'expo-notifications';
export async function syncPickupReminders(orders,userId){
 const permission=await Notifications.getPermissionsAsync();if(!permission.granted)return;
 const wanted=new Map();
 for(const order of orders){
  if(!['confirmado','en_preparacion','listo'].includes(order.estado))continue;
  const pickup=new Date(order.fecha_recogida_programada).getTime();if(!Number.isFinite(pickup))continue;
  for(const minutes of [30,15,5]){const at=pickup-minutes*60000;if(at<=Date.now())continue;
   const identifier=`pickup:${userId}:${order.id}:${minutes}`;
   wanted.set(identifier,{identifier,content:{title:`Tu recogida es en ${minutes} minutos`,body:`Consulta el estado del pedido DC-${String(order.id).padStart(6,'0')} y presenta tu código al llegar.`,sound:'default',data:{type:'pickup_reminder',orderId:String(order.id),ownerId:String(userId)}},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(at),channelId:'orders'}});
  }
 }
 const existing=await Notifications.getAllScheduledNotificationsAsync();
 const ids=new Set(existing.map(n=>n.identifier));
 for(const notice of existing)if(notice.content.data?.type==='pickup_reminder'&&!wanted.has(notice.identifier))await Notifications.cancelScheduledNotificationAsync(notice.identifier);
 for(const [id,request]of wanted)if(!ids.has(id))await Notifications.scheduleNotificationAsync(request);
}
