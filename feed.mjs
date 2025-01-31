import { db, storage } from './firebase.mjs';
import { 
  getDocs, collection, addDoc, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { 
  getDownloadURL, ref, uploadBytes 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

// Elementos del DOM
const feed = document.getElementById('feed');
const postButton = document.querySelector('.post-button');
const postFormContainer = document.getElementById('post-form-container');
const cancelPostButton = document.getElementById('cancel-post');
const postForm = document.getElementById('post-form');

// Función para mostrar el formulario de publicación
function showPostForm() {
  postFormContainer.classList.remove('hidden');
}

// Función para ocultar el formulario de publicación
function hidePostForm() {
  postFormContainer.classList.add('hidden');
  postForm.reset();
}

// Agregar eventos de clic
if (postButton && postFormContainer) {
  postButton.addEventListener('click', showPostForm);
}

if (cancelPostButton) {
  cancelPostButton.addEventListener('click', hidePostForm);
}

// Función para agregar una publicación válida al feed
function addPostToFeed(post) {
  const postElement = document.createElement('div');
  postElement.className = 'photo-card';

  // Manejo seguro de la fecha
  let postDate;
  if (post.date && post.date.seconds) {
    postDate = new Date(post.date.seconds * 1000);
  } else {
    postDate = new Date(); // Usa la fecha actual si no hay timestamp
  }

  postElement.innerHTML = `
    <div class="photo-header">
      <h3>${post.city}</h3>
      <p>${postDate.toLocaleString()}</p>
    </div>
    <img src="${post.imageUrl}" alt="Publicación de ${post.city}" id="image-${post.id}" />
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

// Subir imagen a Firebase Storage y obtener URL
async function uploadImage(file) {
  const fileRef = ref(storage, `posts/${file.name}`);
  const snapshot = await uploadBytes(fileRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Manejar el envío del formulario de publicación
if (postForm) {
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const city = document.getElementById('city').value.trim();
    const alias = document.getElementById('alias').value.trim();
    const imageInput = document.getElementById('image').files[0];

    if (!city || !alias || !imageInput) {
      alert('Todos los campos son obligatorios.');
      return;
    }

    try {
      // Subir imagen a Firebase Storage
      const imageUrl = await uploadImage(imageInput);

      // Guardar los datos en Firestore
      const docRef = await addDoc(collection(db, 'posts'), {
        city,
        alias,
        imageUrl,
        date: serverTimestamp()
      });

      // Agregar la publicación al feed
      addPostToFeed({
        id: docRef.id,
        city,
        imageUrl,
        date: new Date()
      });

      alert('Imagen publicada con éxito.');
      hidePostForm();

    } catch (error) {
      console.error('Error al subir la publicación:', error);
      alert('Error al subir la publicación. Inténtalo de nuevo.');
    }
  });
}

// Verificar si la imagen está disponible en Firebase Storage
async function isImageAvailable(imageUrl) {
  if (!imageUrl) return false;
  try {
    const imageRef = ref(storage, imageUrl);
    await getDownloadURL(imageRef);
    return true;
  } catch (error) {
    return false; // Imagen no encontrada o error
  }
}

// Cargar publicaciones evitando imágenes rotas
async function loadPosts() {
  const querySnapshot = await getDocs(collection(db, 'posts'));
  for (const doc of querySnapshot.docs) {
    const post = doc.data();
    post.id = doc.id;

    const imageAvailable = await isImageAvailable(post.imageUrl);
    if (imageAvailable) {
      addPostToFeed(post);
    } else {
      console.warn(`Imagen no disponible para el post: ${post.id}, omitiendo...`);
    }
  }
}

// Cargar publicaciones al iniciar la página
document.addEventListener('DOMContentLoaded', async () => {
  await loadPosts();
});
