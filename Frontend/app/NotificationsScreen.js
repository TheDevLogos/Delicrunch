import React,{useState} from 'react';
import {ActivityIndicator,Alert,FlatList,Text,TouchableOpacity,View,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useInbox} from '../contexts/InboxContext';
import {COLORS} from '../src/constants/theme';
import {useAuth} from '../contexts/AuthContext';
export default function NotificationsScreen({navigation}){
 const {items,unread,error,loading,refresh,markRead,markAll,loadMore,nextCursor}=useInbox();
 const {user}=useAuth();const [busy,setBusy]=useState(false);
 const open=async item=>{if(busy)return;setBusy(true);try{
  await markRead(item.id);const data=item.data||{};
  if(['merchant_order','buyer_order','admin_order'].includes(data.type)&&data.orderId) navigation.navigate('OrderDetail',{orderId:data.orderId,merchant:data.type==='merchant_order'});
  else if(data.type==='buyer_review') {if(data.orderId)navigation.navigate('OrderDetail',{orderId:data.orderId});else navigation.navigate('MyReviews');}
  else if(data.type==='merchant_review')navigation.navigate('StoreReviews');
  else if(data.type==='admin_review'&&user.rol==='admin')navigation.navigate('AdminReviews');
  else if(data.type==='business_visit'&&user.rol==='admin')navigation.navigate('AdminVisits');
  else if(data.type==='admin_store'&&user.rol==='admin')navigation.navigate('AdminStores');
  else if(data.type==='store_status')navigation.navigate('MainTabs',{screen:'Perfil'});
 }catch(e){Alert.alert('No se pudo abrir el aviso',e.response?.data?.msg||'Reintenta en unos momentos.');}finally{setBusy(false);}};
 const readAll=async()=>{try{await markAll();}catch(e){Alert.alert('Error','No se pudieron marcar los avisos.');}};
 return <SafeAreaView style={s.root} edges={['left','right','bottom']}>
  <View style={s.summary}><Text style={s.subtitle}>{unread} sin leer</Text><TouchableOpacity onPress={readAll} disabled={!unread||loading}><Text style={s.link}>Marcar todos como leídos</Text></TouchableOpacity></View>
  {error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  <FlatList data={items} keyExtractor={n=>String(n.id)} refreshing={loading} onRefresh={refresh} contentContainerStyle={s.list}
   ListEmptyComponent={<Text style={s.empty}>{loading?'Cargando avisos…':'Aquí aparecerán los avisos de tu cuenta.'}</Text>}
   ListFooterComponent={nextCursor?<TouchableOpacity style={s.more} onPress={loadMore} disabled={loading}><Text style={s.link}>Cargar anteriores</Text></TouchableOpacity>:null}
   renderItem={({item})=><TouchableOpacity style={[s.card,!item.leido&&s.unread]} onPress={()=>open(item)} disabled={busy} accessibilityLabel={`${item.leido?'':'Sin leer. '}${item.titulo}. ${item.mensaje}`}>
    <Ionicons name={item.tipo==='pago'?'cash-outline':item.tipo==='visita'?'storefront-outline':'notifications-outline'} size={22} color={COLORS.primary}/>
    <View style={s.body}><Text style={s.title}>{item.titulo}</Text><Text style={s.message}>{item.mensaje}</Text><Text style={s.date}>{new Date(item.created_at).toLocaleString('es-MX')}</Text></View>{!item.leido&&<View style={s.dot}/>}
   </TouchableOpacity>}/>
 </SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:COLORS.background},summary:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap',gap:10,padding:16},subtitle:{fontSize:14,color:COLORS.textSecondary},link:{fontSize:13,fontWeight:'700',color:COLORS.primary},list:{padding:16,paddingTop:0,width:'100%',maxWidth:760,alignSelf:'center'},card:{flexDirection:'row',gap:12,padding:16,borderRadius:16,marginBottom:10,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},unread:{borderColor:COLORS.primary},body:{flex:1},title:{fontSize:15,fontWeight:'800',color:COLORS.text},message:{fontSize:14,lineHeight:20,color:COLORS.textSecondary,marginTop:5},date:{fontSize:11,color:COLORS.textSecondary,marginTop:9},dot:{width:8,height:8,borderRadius:4,backgroundColor:COLORS.primary},empty:{textAlign:'center',paddingVertical:40,color:COLORS.textSecondary},error:{color:COLORS.error,padding:16},more:{padding:16,alignItems:'center'}});
