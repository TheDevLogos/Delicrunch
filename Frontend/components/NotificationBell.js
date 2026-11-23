import React from 'react';
import {View,Text,TouchableOpacity,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useNavigation} from '@react-navigation/native';
import {useInbox} from '../contexts/InboxContext';
import {COLORS} from '../src/constants/theme';
export default function NotificationBell(){
 const navigation=useNavigation();const {unread,error}=useInbox();
 return <TouchableOpacity style={s.button} accessibilityRole="button" accessibilityLabel={`Notificaciones, ${unread} sin leer${error?', sin conexión':''}`} onPress={()=>navigation.navigate('Notifications')}>
  <Ionicons name="notifications-outline" size={25} color={COLORS.primary}/>
  {unread>0&&<View style={s.badge}><Text style={s.count}>{unread>99?'99+':unread}</Text></View>}
  {error&&<View style={s.offline}/>}
 </TouchableOpacity>;
}
const s=StyleSheet.create({button:{width:48,height:44,justifyContent:'center',alignItems:'center',marginRight:10},badge:{position:'absolute',right:0,top:0,backgroundColor:COLORS.primary,borderRadius:12,minWidth:19,paddingHorizontal:4},count:{color:'#fff',fontWeight:'800',fontSize:11,textAlign:'center'},offline:{width:7,height:7,backgroundColor:COLORS.warning,borderRadius:4,position:'absolute',bottom:3,right:8}});
