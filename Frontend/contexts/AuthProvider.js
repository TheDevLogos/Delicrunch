import React, { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import logger from '../services/logger';
import AuthContext from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const authContext = useMemo(() => ({
    user,
    signIn: async (token) => {
      setIsLoading(true);
      try {
        await AsyncStorage.setItem('userToken', token);
        const profileResponse = await api.get('/profiles/me');
        const userData = { token, ...profileResponse.data };
        setUser(userData);
      } catch (e) {
        logger.error(e, 'AuthProvider.signIn');
        await AsyncStorage.removeItem('userToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      setIsLoading(true);
      await AsyncStorage.removeItem('userToken');
      setUser(null);
      setIsLoading(false);
    },
  }), [user]);

  useEffect(() => {
    const bootstrapAsync = async () => {
      let token;
      try {
        token = await AsyncStorage.getItem('userToken');
        if (token) {
          const profileResponse = await api.get('/profiles/me');
          const userData = { token, ...profileResponse.data };
          setUser(userData);
        }
      } catch (e) {
        logger.error(e, 'AuthProvider.bootstrap');
        await AsyncStorage.removeItem('userToken');
        setUser(null);
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
