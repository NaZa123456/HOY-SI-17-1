const express = require('express');
const bodyParser = require('body-parser');
const { MercadoPago } = require('mercadopago');
const admin = require('firebase-admin'); // Agregar Firebase Admin

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializa Mercado Pago con tu Access Token
MercadoPago.configurations.setAccessToken('APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637');

// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://your-project-id.firebaseio.com', // Reemplaza con tu URL de Firestore
});

const db = admin.firestore();

// Middleware para parsear el body de la notificación
app.use(bodyParser.json());

// Endpoint de Webhook para recibir las notificaciones
app.post('/payment/webhook', (req, res) => {
  const paymentData = req.body;

  // Verificar el estado del pago
  if (paymentData?.type === 'payment') {
    const paymentId = paymentData?.data?.id;

    // Verifica el estado del pago
    MercadoPago.payment.findById(paymentId).then(payment => {
      if (payment.status === 'approved') {
        // El pago fue aprobado, transferir el dinero a la cuenta del vendedor
        const imageUrl = paymentData?.data?.external_reference; // Usamos imageUrl como identificador
        getSellerAlias(imageUrl).then(sellerAlias => {
          if (sellerAlias) {
            transferToSeller(sellerAlias, payment.transaction_amount);
          } else {
            console.log('No se encontró el alias del vendedor');
          }
        }).catch(error => {
          console.error('Error al obtener alias desde Firestore:', error);
        });
      } else {
        console.log('El pago no fue aprobado');
      }
    }).catch(error => {
      console.error('Error al verificar el pago:', error);
    });
  }

  res.status(200).send('Webhook recibido');
});

// Función para obtener el alias del vendedor desde Firestore usando imageUrl
function getSellerAlias(imageUrl) {
  return db.collection('posts')  // La colección de posts
    .where('imageUrl', '==', imageUrl)  // Buscar por el campo imageUrl
    .get()
    .then(snapshot => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];  // Tomamos el primer documento que coincide
        return doc.data().alias; // Retornamos el alias del vendedor
      } else {
        throw new Error('Imagen no encontrada en Firestore');
      }
    });
}

// Función para transferir dinero a la cuenta del vendedor
function transferToSeller(sellerAlias, amount) {
  const transferAmount = amount * 0.82;  // 82% del pago

  // Aquí se debe llamar a la API de Mercado Pago para realizar la transferencia
  // Suponiendo que tienes el token de acceso para hacer transferencias
  MercadoPago.account.transfer({
    amount: transferAmount,
    transaction_details: {
      description: 'Pago por foto subida',
    },
    payer_email: sellerAlias, // Alias del vendedor
  }).then(response => {
    console.log('Transferencia realizada:', response);
  }).catch(error => {
    console.error('Error en la transferencia:', error);
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
