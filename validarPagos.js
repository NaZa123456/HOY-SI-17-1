import express from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const MP_ACCESS_TOKEN = 'APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637'; // Asegúrate de poner tu token

// Webhook para recibir notificaciones de Mercado Pago
app.post('/webhook', async (req, res) => {
  const paymentData = req.body;

  if (paymentData.action === 'payment.created' || paymentData.action === 'payment.updated') {
    const paymentId = paymentData.data.id;

    // Verificar el estado del pago usando la API de Mercado Pago
    const paymentStatus = await checkPaymentStatus(paymentId);

    // Guardar el estado del pago en tu base de datos
    paymentsDB[paymentId] = paymentStatus;

    console.log(`Pago recibido y almacenado: ID=${paymentId}, Estado=${paymentStatus}`);
    res.sendStatus(200); // Confirmamos la recepción del webhook
  } else {
    res.sendStatus(400);
  }
});

// Función para consultar el estado del pago en Mercado Pago
const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    const paymentData = await response.json();
    if (paymentData.status === 'approved') {
      return 'approved';
    } else {
      return 'pending';
    }
  } catch (error) {
    console.error('Error verificando el pago:', error);
    return 'error';
  }
};

// Endpoint para verificar el estado de un pago
app.get('/check-payment', (req, res) => {
  const { paymentId } = req.query;

  if (paymentsDB[paymentId] === 'approved') {
    return res.json({ status: 'approved' });
  }

  return res.json({ status: 'pending' });
});













const PORT = 10000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
