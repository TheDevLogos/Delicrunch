const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testCreatePreference() {
    try {
        console.log('🔐 Iniciando sesión...');
        
        // 1. Login con usuario comprador
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'testbuyer2@delicrunch.com',
            password: 'Test1234!'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso, token:', token.substring(0, 20) + '...');
        
        // 2. Crear preferencia de pago
        console.log('\n💳 Creando preferencia de pago...');
        const preferenceResponse = await axios.post(
            `${API_URL}/payments/create-preference`,
            {
                productId: 11,
                cantidad: 1,
                coupon_discount: 0
            },
            {
                headers: {
                    'x-auth-token': token
                }
            }
        );
        
        console.log('✅ Preferencia creada exitosamente!');
        console.log('Preference ID:', preferenceResponse.data.preferenceId);
        console.log('Init Point:', preferenceResponse.data.initPoint);
        console.log('Amount:', preferenceResponse.data.amount);
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testCreatePreference();
