import React,{useState,useCallback} from 'react';
import {ScrollView,Text,View,TouchableOpacity,Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {MERCHANT_REWARDS} from '../../src/constants/merchantGamification';
import api from '../../services/api';import {COLORS} from '../../src/constants/theme';
export default function AdminMerchantRewardsScreen(){
 const [items,setItems]=useState([]);const [busy,setBusy]=useState(false);
 const load=()=>api.get('/merchant-rewards/claims').then(r=>setItems(r.data)).catch(()=>Alert.alert('Error','No se pudieron cargar las solicitudes.'));
 useFocusEffect(useCallback(()=>{load();},[]));
 const update=async(id,status)=>{if(busy)return;setBusy(true);try{await api.patch(`/merchant-rewards/claims/${id}`,{status});await load();}catch(e){Alert.alert('Error',e.response?.data?.msg||'No se pudo actualizar.');}finally{setBusy(false);}};
 return <ScrollView style={{flex:1,backgroundColor:COLORS.background}} contentContainerStyle={{padding:16}}>{!items.length&&<Text>No hay solicitudes de recompensas.</Text>}{items.map(item=><View key={item.id} style={{backgroundColor:'#fff',padding:18,marginBottom:12,borderRadius:16}}><Text style={{fontWeight:'800',fontSize:16}}>{item.nombre_comercio||item.nombre}</Text><Text>{MERCHANT_REWARDS.flatMap(g=>g.rewards).find(r=>r.id===item.reward_id)?.name||'Recompensa'}</Text><Text style={{marginVertical:8}}>{({requested:'Por revisar',fulfilled:'Entregada',rejected:'Rechazada'})[item.status]}</Text>{item.status==='requested'&&<View style={{flexDirection:'row',gap:24}}><TouchableOpacity disabled={busy} onPress={()=>update(item.id,'fulfilled')}><Text style={{color:COLORS.primary}}>Confirmar entrega</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={()=>update(item.id,'rejected')}><Text style={{color:COLORS.error}}>Rechazar</Text></TouchableOpacity></View>}</View>)}</ScrollView>;
}
