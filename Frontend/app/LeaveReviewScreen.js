import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledButton from '../components/StyledButton';
import api from '../services/api';
import logger from '../services/logger';

// Componente para la selección de estrellas
const StarRating = ({ rating, setRating }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setRating(star)}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={40}
            color="#ffc107"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const LeaveReviewScreen = ({ route, navigation }) => {
  const { orderId, productId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Calificación Requerida', 'Por favor, selecciona al menos una estrella.');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        producto_id: productId,
        pedido_id: orderId,
        calificacion: rating,
        comentario: comment,
      };

      // Asumimos un endpoint POST /reviews para guardar la reseña
      await api.post('/reviews', reviewData);

      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada.');
      navigation.goBack();

    } catch (error) {
      logger.error(error, 'handleSubmitReview');
      Alert.alert('Error', error.response?.data?.msg || 'No se pudo enviar tu reseña. Es posible que ya hayas dejado una para este pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Deja tu Reseña</Text>
      <Text style={styles.subtitle}>¿Qué te pareció el producto?</Text>

      <StarRating rating={rating} setRating={setRating} />

      <TextInput
        style={styles.commentInput}
        placeholder="Escribe tu comentario (opcional)..."
        value={comment}
        onChangeText={setComment}
        multiline
        placeholderTextColor="#8A8A8E"
      />

      <StyledButton
        title="Enviar Reseña"
        onPress={handleSubmitReview}
        isLoading={isSubmitting}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 30,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  commentInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
});

export default LeaveReviewScreen;