import React, { useState } from 'react';
import { Modal, View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { publicApi } from '../services/api';
import { COLORS, COMMON_STYLES } from '../src/constants/theme';
const fields = [['business_name','Nombre del negocio',120],['contact_name','Persona de contacto',100],['phone','Teléfono',30],['email','Correo (opcional)',160],['address','Dirección del local',250],['city','Ciudad',80],['preferred_time','Días y horario para contactarte (opcional)',160],['notes','Cuéntanos sobre tu negocio (opcional)',1000]];
export default function BusinessVisitModal({ visible, onClose }) {
 const [form,setForm]=useState({}); const [consent,setConsent]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [sent,setSent]=useState(false);
 const close=()=>{if(!busy){onClose(); if(sent){setForm({});setConsent(false);setSent(false);} setMessage('');}};
 const submit=async()=>{
  if(!['business_name','contact_name','phone','address','city'].every(k=>form[k]?.trim()) || !consent) return setMessage('Completa negocio, contacto, teléfono, dirección, ciudad y autorización.');
  if((form.phone||'').replace(/\D/g,'').length<10) return setMessage('Escribe un teléfono de al menos 10 dígitos.');
  setBusy(true);setMessage('');
  try {const r=await publicApi.post('/business-visits',{...form,consent});setSent(true);setMessage(r.data.message);} catch(e){setMessage(e.response?.data?.message || 'No se pudo enviar. Tus datos siguen aquí; intenta de nuevo.');} finally{setBusy(false);}
 };
 return <Modal visible={visible} animationType="slide" onRequestClose={close}><SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}><View style={styles.header}><Text style={styles.title}>Agendamos una visita a tu local</Text><TouchableOpacity onPress={close} disabled={busy} accessibilityLabel="Cerrar formulario"><Ionicons name="close" size={26} color={COLORS.text}/></TouchableOpacity></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
 <Text style={styles.copy}>Conoce cómo rescatar alimentos con Deli. Te contactaremos para acordar el día y la hora de la visita.</Text>
 {!sent && <>{fields.map(([key,label,max])=><View key={key} style={{marginBottom:14}}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={[COMMON_STYLES.input,key==='notes'&&{height:90,textAlignVertical:'top',paddingTop:12}]} value={form[key]||''} onChangeText={v=>setForm(f=>({...f,[key]:v}))} editable={!busy} maxLength={max} multiline={key==='notes'} keyboardType={key==='phone'?'phone-pad':key==='email'?'email-address':'default'} autoCapitalize={key==='email'?'none':'sentences'}/></View>)}
 <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{checked:consent}} onPress={()=>setConsent(!consent)} disabled={busy} style={styles.consent}><Ionicons name={consent?'checkbox':'square-outline'} size={25} color={COLORS.primary}/><Text style={[styles.copy,{flex:1}]}>Autorizo a Delicrunch a usar estos datos para contactarme y coordinar una visita a mi negocio.</Text></TouchableOpacity></>}
 {!!message && <Text accessibilityRole="alert" style={styles.feedback}>{message}</Text>}
 <TouchableOpacity style={styles.button} disabled={busy} onPress={sent?close:submit}>{busy?<ActivityIndicator color={COLORS.white}/>:<Text style={styles.buttonText}>{sent?'Listo':'Solicitar visita'}</Text>}</TouchableOpacity>
 </ScrollView></KeyboardAvoidingView></SafeAreaView></Modal>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:COLORS.background},header:{padding:20,flexDirection:'row',alignItems:'center',gap:12},title:{flex:1,fontSize:22,fontWeight:'800',color:COLORS.text},content:{padding:20,paddingBottom:40,width:'100%',maxWidth:600,alignSelf:'center'},copy:{fontSize:14,lineHeight:21,color:COLORS.textSecondary,marginBottom:16},label:{fontSize:14,fontWeight:'600',color:COLORS.text,marginBottom:7},consent:{flexDirection:'row',gap:10},feedback:{color:COLORS.text,fontSize:15,marginBottom:15},button:{backgroundColor:COLORS.primary,padding:16,borderRadius:16,alignItems:'center'},buttonText:{color:COLORS.white,fontWeight:'700',fontSize:16}});
