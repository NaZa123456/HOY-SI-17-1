import { db, storage } from './firebase.mjs';
import { getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getDownloadURL, ref } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

// Elementos del DOM relacionados con el feed
const feed = document.getElementById('feed');

// Verificar si los elementos existen
if (feed) {
  // Función para agregar una publicación al feed
  function addPostToFeed(post) {
    const postElement = document.createElement('div');
    postElement.className = 'photo-card';

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
    await loadPosts();
  });
} else {
  console.error('El elemento del feed no se encontró en el DOM.');
}
