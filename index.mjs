import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';
import crypto from 'crypto';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware para habilitar CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.set('view engine', 'ejs');

// Configuración de rutas de plantillas y archivos estáticos
const templatePath = path.join(__dirname, 'templates');
app.set('views', templatePath);
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use(express.static(path.join(__dirname)));

// Middleware para parsear JSON y datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuración de sesión
app.use(
  session({
    secret: 'Naza16102006Pirotecnia',
    resave: false,
    saveUninitialized: false,
  })
);

// MercadoPago - Clave secreta
const MP_SECRET_KEY = 'APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637';

// Función para verificar la firma
function verifySignatureFunction(secretKey, timestamp, data, receivedSignature) {
  const rawData = `${timestamp}.${JSON.stringify(data)}`;
  const hmac = crypto.createHmac('sha256', secretKey).update(rawData).digest('hex');
  console.log('Firma calculada:', hmac);
  return hmac === receivedSignature;
}

// Endpoint para el webhook de MercadoPago
app.post('/webhook', (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  const signatureHeader = req.headers['x-signature'];
  if (!signatureHeader) {
    console.error('Encabezado x-signature faltante');
    return res.status(400).send('Firma no válida.');
  }

  const timestampMatch = signatureHeader.match(/ts=(\d+)/);
  const signatureMatch = signatureHeader.match(/v1=([a-f0-9]+)/);

  if (!timestampMatch || !signatureMatch) {
    console.error('No se pudo extraer la firma o el timestamp.');
    return res.status(400).send('Firma no válida.');
  }

  const timestamp = timestampMatch[1];
  const receivedSignature = signatureMatch[1];
  console.log('Timestamp:', timestamp);
  console.log('Firma recibida (v1):', receivedSignature);

  const isValidSignature = verifySignatureFunction(MP_SECRET_KEY, timestamp, req.body, receivedSignature);

  if (isValidSignature) {
    console.log('Firma válida');
    if (req.body.status === 'approved') {
      console.log('Pago aprobado:', req.body);
      res.status(200).send('Pago aprobado');
    } else {
      console.log('Pago no aprobado:', req.body);
      res.status(400).send('Pago no aprobado');
    }
  } else {
    console.error('Firma no válida');
    res.status(400).send('Firma no válida');
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
