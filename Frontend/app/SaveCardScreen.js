/**
 * SaveCardScreen - Pantalla para guardar métodos de pago
 * 
 * Permite a los usuarios agregar tarjetas de crédito de forma segura
 * usando Stripe Payment Sheet
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { presentPaymentSheetForCardSetup } from '../services/stripeCustomerService';
import { Ionicons } from '@expo/vector-icons';

const SaveCardScreen = ({ navigation }) => {
    const stripe = useStripe();
    const [loading, setLoading] = useState(false);

    /**
     * Maneja el flujo completo de guardar una tarjeta
     */
    const handleAddCard = async () => {
        try {
            setLoading(true);

            console.log('🔄 Iniciando proceso de agregar tarjeta...');

            // Llamar al servicio que maneja todo el flujo
            const success = await presentPaymentSheetForCardSetup(stripe);

            if (success) {
                // Tarjeta guardada exitosamente
                Alert.alert(
                    '✅ ¡Éxito!',
                    'Tu tarjeta se ha guardado correctamente',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(), // Volver a la pantalla anterior
                        },
                    ]
                );
            } else {
                // Usuario canceló
                console.log('ℹ️ El usuario canceló la operación');
            }

        } catch (error) {
            console.error('❌ Error al agregar tarjeta:', error);

            // Mostrar error al usuario
            Alert.alert(
                '❌ Error',
                error.message || 'No se pudo guardar la tarjeta. Inténtalo de nuevo.',
                [{ text: 'OK' }]
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="card-outline" size={80} color="#4CAF50" />
                <Text style={styles.title}>Agregar Tarjeta</Text>
                <Text style={styles.subtitle}>
                    Guarda tu tarjeta de forma segura para compras más rápidas
                </Text>
            </View>

            {/* Info Cards */}
            <View style={styles.infoContainer}>
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                    <Text style={styles.infoText}>
                        Tus datos están protegidos con encriptación de nivel bancario
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="lock-closed" size={24} color="#4CAF50" />
                    <Text style={styles.infoText}>
                        No almacenamos tu número de tarjeta completo
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="flash" size={24} color="#4CAF50" />
                    <Text style={styles.infoText}>
                        Paga más rápido en futuras compras
                    </Text>
                </View>
            </View>

            {/* Botón Principal */}
            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAddCard}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Ionicons name="add-circle" size={24} color="#FFF" />
                        <Text style={styles.buttonText}>Agregar Tarjeta</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Nota de Stripe */}
            <View style={styles.stripeNote}>
                <Text style={styles.stripeText}>
                    Procesado de forma segura por
                </Text>
                <Text style={styles.stripeBrand}>Stripe</Text>
            </View>

            {/* Botón Cancelar */}
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
            >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    infoContainer: {
        marginBottom: 30,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 15,
        flex: 1,
    },
    button: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7',
        shadowOpacity: 0.1,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    stripeNote: {
        alignItems: 'center',
        marginBottom: 10,
    },
    stripeText: {
        fontSize: 12,
        color: '#999',
    },
    stripeBrand: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#635BFF', // Color oficial de Stripe
        marginTop: 5,
    },
    cancelButton: {
        padding: 15,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#666',
    },
});

export default SaveCardScreen;
