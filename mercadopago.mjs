const express = require('express');
const bodyParser = require('body-parser');
const mercadopago = require('mercadopago'); // Importación correcta
const admin = require('firebase-admin'); // Firebase Admin

const app = express();
const PORT = process.env.PORT || 10000;

// Inicializa Mercado Pago con tu Access Token
mercadopago.configurations.setAccessToken('APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637');

// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

// Middleware para parsear el body de la notificación
app.use(bodyParser.json());

// Webhook para notificaciones de Mercado Pago
app.post('/payment/webhook', async (req, res) => {  //poner URL de mi dominio
  try {
    const paymentData = req.body;

    if (paymentData?.type === 'payment') {
      const paymentId = paymentData?.data?.id;

      // Verifica el pago en Mercado Pago
      const payment = await mercadopago.payment.findById(paymentId);
      if (payment.body.status === 'approved') {
        // Busca el alias del vendedor en Firestore
        const imageUrl = payment.body.external_reference;
        const sellerAlias = await getSellerAlias(imageUrl);

        if (sellerAlias) {
          await transferToSeller(sellerAlias, payment.body.transaction_details.total_paid_amount);
          console.log('Transferencia realizada con éxito');
        } else {
          console.error('Alias del vendedor no encontrado');
        }
      } else {
        console.log('El pago no fue aprobado');
      }
    }

    res.status(200).send('Webhook recibido');
  } catch (error) {
    console.error('Error en el webhook:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Función para obtener el alias del vendedor desde Firestore
async function getSellerAlias(imageUrl) {
  const snapshot = await db.collection('posts').where('imageUrl', '==', imageUrl).get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return doc.data().alias; // Retorna el alias del vendedor
  } else {
    throw new Error('Imagen no encontrada en Firestore');
  }
}

// Función para transferir dinero al vendedor
async function transferToSeller(sellerAlias, amount) {
  const transferAmount = amount * 0.88; // 88% del pago

  try {
    // Realiza la transferencia utilizando la API de dinero en cuenta
    const transferResponse = await mercadopago.transfer.create({
      amount: transferAmount,
      receiver_alias: sellerAlias, // Alias del destinatario
      description: 'Pago por foto subida',
    });
    console.log('Transferencia realizada:', transferResponse.body);
  } catch (error) {
    console.error('Error en la transferencia:', error.response?.message || error);
  }
}


