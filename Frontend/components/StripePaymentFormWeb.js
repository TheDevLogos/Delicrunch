import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import {
  useStripe,
  useElements,
  CardElement,
} from '@stripe/react-stripe-js';
import StyledButton from './StyledButton';
import logger from '../services/logger';

const cardElementOptions = {
  style: {
    base: {
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const StripePaymentFormWeb = ({ clientSecret, onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (paymentError) {
      logger.error(paymentError, 'Stripe Web Payment Error');
      setError(paymentError.message);
      setIsProcessing(false);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      onPaymentSuccess();
    } else {
      setError('El pago no se pudo completar. Estado: ' + paymentIntent.status);
    }

    setIsProcessing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Introduce los datos de tu tarjeta:</Text>
      <View style={styles.cardContainer}>
        <CardElement options={cardElementOptions} />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <StyledButton
        title={isProcessing ? 'Procesando...' : 'Pagar'}
        onPress={handleSubmit}
        disabled={!stripe || isProcessing}
        isLoading={isProcessing}
        variant="success"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  label: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
  cardContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default StripePaymentFormWeb;