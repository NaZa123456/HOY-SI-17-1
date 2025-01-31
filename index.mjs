import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import session from 'express-session';
import axios from 'axios';


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

// Conexión a MongoDB Atlas
const mongoURI =
  'mongodb+srv://nazarenoaraya2017:Pirotecnia2029@skatedatabase.m9xr5.mongodb.net/SkateMobileDatabase?retryWrites=true&w=majority';
mongoose
  .connect(mongoURI, {})
  .then(() => console.log('MongoDB Atlas conectado'))
  .catch((err) => console.error('Error de conexión a MongoDB:', err));

// Definición del esquema y modelo de usuario
const LogInSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gmail: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  instagram: { type: String, required: true },
  role: { type: String, enum: ['Usuario', 'Fotógrafo'], required: true },
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
app.get('/', (req, res) => {
  res.sendFile(path.join(templatePath, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(templatePath, 'signup.html'));
});

app.get('/home', isAuthenticated, (req, res) => {
  res.sendFile(path.join(templatePath, 'home.html'));
});

app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }
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
      req.session.user = { id: user._id, name: user.name, role: user.role };
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


const PORT = process.env.PORT || 10000; // Usa el puerto de Render o el 3000 por defecto

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

