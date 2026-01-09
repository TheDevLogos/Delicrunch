import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import logger from '../services/logger';
import AuthContext from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Rol simulado para admin - permite cambiar vista entre roles
  const [simulatedRole, setSimulatedRoleState] = useState(null);
  // Estado de transición para mostrar pantalla de carga al cambiar rol
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Función para cambiar el rol simulado con transición
  const setSimulatedRole = useCallback(async (newRole) => {
    setIsTransitioning(true);
    
    // Pequeña espera para mostrar la transición
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSimulatedRoleState(newRole);
    
    // Guardar en AsyncStorage para persistir
    if (newRole) {
      await AsyncStorage.setItem('simulatedRole', newRole);
    } else {
      await AsyncStorage.removeItem('simulatedRole');
    }
    
    setIsTransitioning(false);
  }, []);

  // Obtener el rol efectivo (simulado si existe, o el real)
  const effectiveRole = useMemo(() => {
    // Solo admin puede simular otros roles
    if (user?.rol === 'admin' && simulatedRole) {
      return simulatedRole;
    }
    return user?.rol || null;
  }, [user, simulatedRole]);

  const authContext = useMemo(() => ({
    user,
    simulatedRole,
    effectiveRole,
    isTransitioning,
    isAdmin: user?.rol === 'admin',
    setSimulatedRole,
    signIn: async (token) => {
      setIsLoading(true);
      try {
        await AsyncStorage.setItem('userToken', token);
        const profileResponse = await api.get('/profiles/me');
        const userData = { token, ...profileResponse.data };
        setUser(userData);
        
        // Restaurar rol simulado si existe
        const savedSimulatedRole = await AsyncStorage.getItem('simulatedRole');
        if (savedSimulatedRole && userData.rol === 'admin') {
          setSimulatedRoleState(savedSimulatedRole);
        }
      } catch (e) {
        // Si es un error 401, el token ya fue limpiado por el interceptor
        if (e.response?.status !== 401) {
          logger.error(e, 'AuthProvider.signIn');
        }
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('simulatedRole');
        setUser(null);
        setSimulatedRoleState(null);
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      setIsLoading(true);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('simulatedRole');
      setUser(null);
      setSimulatedRoleState(null);
      setIsLoading(false);
    },
  }), [user, simulatedRole, effectiveRole, isTransitioning, setSimulatedRole]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await AsyncStorage.getItem('userToken');
        if (token) {
          const profileResponse = await api.get('/profiles/me');
          const userData = { token, ...profileResponse.data };
          setUser(userData);
          
          // Restaurar rol simulado si existe y es admin
          const savedSimulatedRole = await AsyncStorage.getItem('simulatedRole');
          if (savedSimulatedRole && userData.rol === 'admin') {
            setSimulatedRoleState(savedSimulatedRole);
          }
        }
      } catch (e) {
        // Si es un error 401, el token ya fue limpiado por el interceptor
        // No necesitamos registrar este error ya que es esperado cuando hay un token inválido
        if (e.response?.status !== 401) {
          logger.error(e, 'AuthProvider.bootstrap');
        }
        // Limpiar estado de autenticación y rol simulado
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('simulatedRole');
        setUser(null);
        setSimulatedRoleState(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  return (
    <AuthContext.Provider value={{ ...authContext, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

