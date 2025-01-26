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
  res.setHeader('Access-Control-Allow-Origin', '*');  // Permite cualquier origen
  res.setHeader('Access-Control-Allow-Methods', 'POST');  // Solo permite métodos POST
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');  // Permite el encabezado Content-Type
  next();
});

app.set('view engine', 'ejs');

// Configuración de rutas de plantillas y archivos estáticos
const templatePath = path.join(__dirname, 'templates');
app.set('views', templatePath);
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use(express.static(path.join(__dirname)));

// Middleware para parsear JSON y datos de formularios
app.use(express.json());  // Esto reemplaza a `bodyParser.json()`
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

// MercadoPago
// Configura tu clave de seguridad de MercadoPago
const MP_SECRET_KEY = 'APP_USR-6105589751863240-011918-6581cf44f56ef1911fd573fc88fb43b1-379964637';  // La clave secreta de tu cuenta de MercadoPago


function verifySignatureFunction(secretKey, data, signature) {
  const body = JSON.stringify(data);  // Convertir los datos a JSON string
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(body);
  const computedSignature = hmac.digest('hex');  // Calcular la firma

  console.log('Firma calculada:', computedSignature);
  console.log('Firma recibida:', signature);

  return computedSignature === signature;  // Comparar las firmas
}

// Endpoint para recibir notificaciones de MercadoPago
app.post('/webhook', (req, res) => {
  console.log('Headers:', req.headers);  // Imprimir todas las cabeceras de la solicitud
  console.log('Body:', req.body);  // Imprimir el cuerpo de la solicitud

  const signature = req.headers['x-mp-signature'];
  const data = req.body;

  console.log('Firma recibida:', signature);  // Imprimir la firma recibida

  const verifySignature = verifySignatureFunction(MP_SECRET_KEY, data, signature);
  if (verifySignature) {
    if (data.status === 'approved') {
      console.log('Pago aprobado:', data);
      res.status(200).send('Pago aprobado');
    } else {
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
