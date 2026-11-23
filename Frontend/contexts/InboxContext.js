import React, {createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
import {AppState} from 'react-native';
import {useAuth} from './AuthContext';
import api from '../services/api';
import {subscribeNewOrders} from '../services/orderEvents';
const InboxContext=createContext(null);
export const useInbox=()=>useContext(InboxContext);
export function InboxProvider({children}) {
 const {user}=useAuth(); const [items,setItems]=useState([]); const [unread,setUnread]=useState(0);
 const [error,setError]=useState(null);const [loading,setLoading]=useState(false);
 const [nextCursor,setNextCursor]=useState(null); const generation=useRef(0);const inFlight=useRef(false);
 const enabled=Boolean(user&&!user.onboarding_required);
 const refresh=useCallback(async()=>{
   if(!enabled||inFlight.current)return;
   const version=generation.current;inFlight.current=true;setLoading(true);
   try {const {data}=await api.get('/notifications',{timeout:10000});if(version!==generation.current)return;
     setItems(data.notifications);setUnread(data.unread);setNextCursor(data.nextCursor);setError(null);
   }catch(e){if(version===generation.current)setError('No se pudieron actualizar los avisos. Desliza para reintentar.');}
   finally{if(version===generation.current){inFlight.current=false;setLoading(false);}}
 },[enabled,user?.id]);
 useEffect(()=>{
   generation.current++;inFlight.current=false;setItems([]);setUnread(0);setError(null);setNextCursor(null);
   if(!enabled)return;
   refresh();const timer=setInterval(()=>{if(AppState.currentState==='active')refresh();},15000);
   const sub=AppState.addEventListener('change',state=>{if(state==='active')refresh();});
   const off=subscribeNewOrders(refresh);
   return()=>{generation.current++;clearInterval(timer);sub.remove();off();};
 },[enabled,user?.id,refresh]);
 const markRead=async id=>{await api.patch(`/notifications/${id}/read`);await refresh();};
 const markAll=async()=>{if(!items.length)return;await api.patch('/notifications/read-all',{throughId:items[0].id});await refresh();};
 const loadMore=async()=>{if(!nextCursor||loading)return;const version=generation.current;setLoading(true);
  try{const {data}=await api.get('/notifications',{params:{before:nextCursor},timeout:10000});
   if(version===generation.current){setItems(old=>[...old,...data.notifications.filter(n=>!old.some(x=>String(x.id)===String(n.id)))]);setNextCursor(data.nextCursor);setUnread(data.unread);}}
  catch(e){if(version===generation.current)setError('No se pudieron cargar más avisos.');}finally{if(version===generation.current)setLoading(false);}};
 return <InboxContext.Provider value={{items,unread,error,loading,refresh,markRead,markAll,loadMore,nextCursor}}>{children}</InboxContext.Provider>;
}
