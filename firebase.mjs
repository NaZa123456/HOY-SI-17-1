// Inicializar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCbiGfA59l3ae6qss_gxTeis1Cec5Jy7Eg",
  authDomain: "skatemapp-38f04.firebaseapp.com",
  projectId: "skatemapp-38f04",
  storageBucket: "skatemapp-38f04.firebasestorage.app",
  messagingSenderId: "752797788253",
  appId: "1:752797788253:web:d7b1eab6cac848f17fc5b4",
  measurementId: "G-1DYY0EJZTX"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Elementos del DOM
const postButton = document.querySelector('.post-button');
const postFormContainer = document.getElementById('post-form-container');
const cancelPostButton = document.getElementById('cancel-post');
const postForm = document.getElementById('post-form');
const feed = document.getElementById('feed');

// Función para agregar una publicación al feed
function addPostToFeed(post) {
  const postElement = document.createElement('div');
  postElement.className = 'photo-card';

  // Convertir el Timestamp de Firestore a un objeto Date
  const postDate = post.date instanceof Date ? post.date : new Date(post.date.seconds * 1000);

  postElement.innerHTML = `
    <div class="photo-header">
      <h3>${post.city}</h3>
      <p>${postDate.toLocaleString()}</p>
    </div>
    <img src="${post.imageUrl}" alt="Publicación de ${post.user}" id="image-${post.id}" />
  `;

  const image = postElement.querySelector('img');
  image.addEventListener('click', () => {
    if (post.id) {
      window.location.href = `/payment.html?imageUrl=${encodeURIComponent(post.imageUrl)}`;
    } else {
      console.error('El postId no está definido.');
    }
  });

  feed.prepend(postElement);
}

// Verificar si la imagen está disponible en Firebase Storage
async function isImageAvailable(imageUrl) {
  try {
    const imageRef = ref(storage, imageUrl);
    await getDownloadURL(imageRef);
    return true;
  } catch (error) {
    return false;
  }
}

// Recuperar publicaciones de Firestore y agregarlas al feed
async function loadPosts() {
  const querySnapshot = await getDocs(collection(db, 'posts'));
  querySnapshot.forEach(async (doc) => {
    const post = doc.data();
    const postId = doc.id;
    const imageAvailable = await isImageAvailable(post.imageUrl);

    if (imageAvailable) {
      post.id = postId;
      addPostToFeed(post);
    }
  });
}

// Cargar publicaciones al iniciar la página
document.addEventListener('DOMContentLoaded', async () => {
  postFormContainer.classList.add('hidden');
  await loadPosts();
});

// Mostrar formulario de publicación
postButton.addEventListener('click', () => {
  postFormContainer.classList.remove('hidden');
});

// Ocultar formulario de publicación
cancelPostButton.addEventListener('click', () => {
  postFormContainer.classList.add('hidden');
});

// Manejar el envío del formulario
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('city').value;
  const alias = document.getElementById('alias').value;
  const imageInput = document.getElementById('image');
  const file = imageInput.files[0];

  if (!city || !file || !alias) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  try {
    // Obtener usuario autenticado desde el servidor
    const response = await fetch('/api/user');
    const user = await response.json();

    if (!user || !user.name) {
      alert('Por favor, inicia sesión para publicar.');
      return;
    }

    // Subir imagen a Firebase Storage
    const fileName = `${Date.now()}-${file.name}`;
    const imageRef = ref(storage, 'images/' + fileName);

    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);

    // Agregar publicación a Firestore
    await addDoc(collection(db, 'posts'), {
      city,
      alias,
      imageUrl,
      user: user.name, // Usuario autenticado
      date: new Date(),
    });

    alert('¡Publicación agregada con éxito!');

    // Añadir publicación al feed
    addPostToFeed({
      city,
      alias,
      imageUrl,
      user: user.name,
      date: new Date(),
    });

    postFormContainer.classList.add('hidden');
    postForm.reset();
  } catch (error) {
    console.error('Error subiendo la imagen:', error);
    alert('Error subiendo la imagen.');
  }
});
