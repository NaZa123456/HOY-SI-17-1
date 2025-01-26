import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';




// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

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
    secret: 'Naza16102006Pirotecnia', // Cambia esto por una clave segura
    resave: false, // No guardar la sesión si no hay cambios
    saveUninitialized: false, // No guardar sesiones vacías
  })
);

// Conexión a MongoDB Atlas
const mongoURI =
  'mongodb+srv://nazarenoaraya2017:Pirotecnia2029@skatedatabase.m9xr5.mongodb.net/SkateMobileDatabase?retryWrites=true&w=majority';
mongoose
  .connect(mongoURI, {})
  .then(() => console.log('MongoDB Atlas conectado'))
  .catch((err) => console.error('Error de conexión a MongoDB:', err));

// Definición del esquema y modelo de usuario
const LogInSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  gmail: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  instagram: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['Usuario', 'Fotógrafo'],
    required: true,
  },
});

const User = mongoose.model('User', LogInSchema);

// Middleware para verificar autenticación
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    return res.redirect('/');
  }
}

// Rutas
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Buscar al usuario autenticado en la base de datos usando su ID de sesión
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    // Renderizar la página de perfil con los datos del usuario
    res.render('profile.ejs', {
      name: user.name,
      instagram: user.instagram,
      role: user.role,
    });
  } catch (err) {
    console.error('Error al cargar el perfil:', err);
    res.status(500).send('Error en el servidor');
  }
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(templatePath, 'search.html'));
});


app.get('/', (req, res) => {
  res.sendFile(path.join(templatePath, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(templatePath, 'signup.html'));
});

app.get('/home', isAuthenticated, (req, res) => {
  res.sendFile(path.join(templatePath, 'home.html'));
});

app.get('/payment.html', (req, res) => {
  res.sendFile(path.join(templatePath, 'payment.html'));
});

// Manejo del registro (signup)
app.post('/signup', async (req, res) => {
  const { name, gmail, password, instagram, role } = req.body;

  if (!name || !gmail || !password || !instagram || !role) {
    return res.send('Por favor, completa todos los campos.');
  }

  try {
    const existingUser = await User.findOne({ gmail });
    if (existingUser) {
      return res.send('El correo ya está registrado. Usa otro correo.');
    }

    await User.create({ name, gmail, password, instagram, role });
    console.log('Usuario registrado exitosamente:', { name, gmail, instagram, role });
    res.redirect('/');
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).send('Error al registrar usuario.');
  }
});

// Manejo del inicio de sesión (login)
app.post('/login', async (req, res) => {
  const { gmail, password } = req.body;

  if (!gmail || !password) {
    return res.send('Por favor, completa todos los campos.');
  }

  try {
    const user = await User.findOne({ gmail });

    if (!user) {
      return res.send('Correo no encontrado.');
    }

    if (user.password === password) {
      // Guardar información del usuario en la sesión
      req.session.user = {
        id: user._id,
        name: user.name,
        role: user.role,
      };
      console.log('Inicio de sesión exitoso.');
      return res.redirect('/home');
    } else {
      res.send('Contraseña incorrecta.');
    }
  } catch (err) {
    console.error('Error en /login:', err);
    res.status(500).send('Error en el servidor.');
  }
});


//mercado pago

// Ejemplo en Node.js con Express
const express = require('express');
const bodyParser = require('body-parser');
const { verify } = require('crypto');  // Para verificar la autenticidad del webhook


// Configura tu clave de seguridad de MercadoPago
const MP_SECRET_KEY = 'APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637';  // La clave secreta de tu cuenta de MercadoPago

// Usar bodyParser para analizar el cuerpo de la solicitud
app.use(bodyParser.json());


function verifySignatureFunction(secretKey, data, signature) {
  const body = JSON.stringify(data);  // El cuerpo de la notificación
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(body);
  const computedSignature = hmac.digest('hex');  // La firma generada

  return computedSignature === signature;  // Comparar la firma calculada con la recibida
}

// Endpoint para recibir notificaciones de MercadoPago
app.post('/webhook', (req, res) => {
  // Verificar la firma de la notificación para asegurar que es de MercadoPago
  const signature = req.headers['x-mp-signature'];
  const data = req.body;

  const verifySignature = verifySignatureFunction(MP_SECRET_KEY, data, signature);
  if (verifySignature) {
    // Procesa el pago (ejemplo, verificar si el estado es "approved")
    if (data.status === 'approved') {
      // El pago fue aprobado, hacer algo con los datos
      console.log('Pago aprobado:', data);
      res.status(200).send('Pago aprobado');
    } else {
      res.status(400).send('Pago no aprobado');
    }
  } else {
    res.status(400).send('Firma no válida');
  }
});

function verifySignatureFunction(secretKey, data, signature) {
  // Verifica que la firma coincida
  const computedSignature = 'sha256=' + verify(secretKey, data, signature);
  return computedSignature === signature;
}




// Ruta para verificar el estado del pago
app.get('/check-payment-status/:paymentId', async (req, res) => {
  const paymentId = req.params.paymentId;

  // Llamar a la API de MercadoPago para obtener el estado del pago
  try {
    const payment = await getPaymentDetails(paymentId);
    if (payment.status === 'approved') {
      res.json({ status: 'approved' });
    } else {
      res.json({ status: 'pending' });
    }
  } catch (error) {
    res.status(500).send('Error al verificar el pago');
  }
});

// Función para obtener detalles del pago desde la API de MercadoPago
async function getPaymentDetails(paymentId) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${MP_SECRET_KEY}`,
    },
  });
  return await response.json();
}








// Iniciar el servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
