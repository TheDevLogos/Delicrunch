import React, {useState,useCallback} from 'react';
import {View,Text,TouchableOpacity,StyleSheet} from 'react-native';
import {useFocusEffect,useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import api from '../services/api';
import {COLORS} from '../src/constants/theme';
export default function AdminVisitBell(){
 const navigation=useNavigation();const [count,setCount]=useState(0);
 useFocusEffect(useCallback(()=>{let active=true;const load=()=>api.get('/business-visits').then(r=>{if(active)setCount(r.data.pending);}).catch(()=>{});load();const timer=setInterval(load,30000);return()=>{active=false;clearInterval(timer);};},[]));
 return <TouchableOpacity style={s.button} onPress={()=>navigation.navigate('AdminVisits')} accessibilityLabel={`Buzón de visitas, ${count} nuevas`}><Ionicons name="notifications-outline" size={25} color={COLORS.primary}/><Text style={s.label}>Solicitudes de visita</Text>{count>0&&<View style={s.badge}><Text style={s.count}>{count>99?'99+':count}</Text></View>}</TouchableOpacity>;
}
const s=StyleSheet.create({button:{flexDirection:'row',alignItems:'center',gap:12,padding:16,margin:16,borderRadius:16,backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border},label:{flex:1,color:COLORS.text,fontWeight:'700',fontSize:15},badge:{borderRadius:20,backgroundColor:COLORS.primary,paddingHorizontal:8,paddingVertical:3},count:{color:COLORS.white,fontWeight:'800',fontSize:12}});
