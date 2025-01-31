import { db } from './firebase.mjs';
import { getDocs, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Elementos del DOM relacionados con la búsqueda
const searchInput = document.getElementById('search-input');
const searchPhotoSection = document.getElementById('search-photo');

// Verificar si los elementos existen
if (searchInput && searchPhotoSection) {
  // Función para agregar fotos filtradas al contenedor
  function addSearchPhotoToGallery(post) {
    const postElement = document.createElement('div');
    postElement.className = 'photo-card';
    postElement.innerHTML = `
      <div class="photo-header">
        <h3>${post.city || 'Sin ciudad'}</h3>
        <p>${post.date?.seconds ? new Date(post.date.seconds * 1000).toLocaleString() : 'Fecha desconocida'}</p>
      </div>
      <img src="${post.imageUrl}" alt="Foto de ${post.city || 'Sin ciudad'}" id="image-${post.id}" />
    `;

    const image = postElement.querySelector('img');
    image.addEventListener('click', () => {
      if (post.id) {
        window.location.href = `/payment.html?imageUrl=${encodeURIComponent(post.imageUrl)}`;
      } else {
        console.error('El postId no está definido.');
      }
    });

    searchPhotoSection.appendChild(postElement);
  }

  // Función para buscar publicaciones
  async function searchPhotos(query) {
    searchPhotoSection.innerHTML = ''; // Limpiar la galería antes de mostrar resultados
    const querySnapshot = await getDocs(collection(db, 'posts'));

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const postId = doc.id;

      // Verificar que la propiedad `city` existe antes de llamar `toLowerCase()`
      if (post.city && typeof post.city === 'string' && post.city.toLowerCase().includes(query.toLowerCase())) {
        post.id = postId; // Asignar el ID al post
        addSearchPhotoToGallery(post);
      }
    });
  }

  // Event listener para el input de búsqueda
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query) {
      searchPhotos(query);
    } else {
      searchPhotoSection.innerHTML = ''; // Limpiar si no hay texto
    }
  });
} else {
  console.error('Los elementos necesarios para la búsqueda no se encontraron en el DOM.');
}
