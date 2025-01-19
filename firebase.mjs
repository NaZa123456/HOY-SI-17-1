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
const closeFormButton = document.getElementById('close-form'); // Cruz para cerrar el formulario
const feed = document.getElementById('feed');

// Función para agregar una publicación al feed
// Función para agregar una publicación al feed
function addPostToFeed(post) {
  const postElement = document.createElement('div');
  postElement.className = 'photo-card';

  // Convertir el Timestamp de Firestore a un objeto Date
  const postDate = post.date instanceof Date ? post.date : new Date(post.date.seconds * 1000);

  postElement.innerHTML = `
    <div class="photo-header">
      <h3>${post.city}</h3>
      <p>${postDate.toLocaleString()}</p>  <!-- Mostrar fecha correctamente -->
    </div>
    <img src="${post.imageUrl}" alt="Publicación de ${post.user}" id="image-${post.id}" />
  `;

  // Añadir el evento de clic a la imagen con el postId
  const image = postElement.querySelector('img');
  image.addEventListener('click', () => {
    if (post.id) {
      window.location.href = `/payment.html?imageUrl=${encodeURIComponent(post.imageUrl)}`;
    } else {
      console.error('El postId no está definido.');
    }
  });

  feed.prepend(postElement); // Agregar el nuevo post al feed
}

// Verificar si la imagen está disponible en Firebase Storage
async function isImageAvailable(imageUrl) {
  try {
    const imageRef = ref(storage, imageUrl);
    await getDownloadURL(imageRef); // Si la imagen no existe, se lanzará un error
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
    const postId = doc.id; // Obtiene el id del documento de Firestore
    const imageAvailable = await isImageAvailable(post.imageUrl);

    // Solo agregar al feed si la imagen está disponible
    if (imageAvailable) {
      post.id = postId; // Añadir el ID al objeto post
      addPostToFeed(post);
    }
  });
}


// Cargar publicaciones al iniciar la página
document.addEventListener('DOMContentLoaded', async () => {
  postFormContainer.classList.add('hidden');
  await loadPosts(); // Cargar las publicaciones desde Firestore
});

// Mostrar formulario de publicación
postButton.addEventListener('click', () => {
  console.log('Abriendo el formulario...');
  postFormContainer.classList.remove('hidden');
});

// Ocultar formulario de publicación al presionar el botón de cancelar
cancelPostButton.addEventListener('click', () => {
  console.log('Cancelando el formulario...');
  postFormContainer.classList.add('hidden');
});

// Manejar el envío del formulario
postForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Evitar recargar la página

  const city = document.getElementById('city').value;
  const alias = document.getElementById('alias').value; // Obtener el alias
  const imageInput = document.getElementById('image');
  const file = imageInput.files[0];

  if (!city || !file || !alias) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  // Subir imagen a Firebase Storage
  const fileName = `${Date.now()}-${file.name}`;
  const imageRef = ref(storage, 'images/' + fileName);

  try {
    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);

    const newPostRef = await addDoc(collection(db, 'posts'), {
      city: city,
      alias: alias, // Guardar alias
      imageUrl: imageUrl,
      user: 'Anon', // Cambia esto si tienes autenticación
      date: new Date(),
    });

    alert('¡Publicación agregada con éxito!');

    // Llama a `addPostToFeed` para agregar la publicación al feed
    addPostToFeed({
      city: city,
      alias: alias, // Incluir alias en el objeto
      imageUrl: imageUrl,
      user: 'Anon',
      date: new Date(),
    });

    postFormContainer.classList.add('hidden');
    postForm.reset();
  } catch (error) {
    console.error('Error subiendo la imagen:', error);
    alert('Error subiendo la imagen.');
  }
});

// Función para eliminar una publicación de Firestore y Firebase Storage
async function deletePost(postId, imageUrl) {
  // Eliminar imagen de Firebase Storage
  const imageRef = ref(storage, imageUrl);
  try {
    await deleteObject(imageRef); // Borrar la imagen
    await deleteDoc(doc(db, 'posts', postId)); // Eliminar la publicación de Firestore
    alert('Publicación eliminada.');
    location.reload(); // Recargar la página para reflejar los cambios
  } catch (error) {
    console.error('Error al eliminar la publicación:', error);
    alert('Error al eliminar la publicación.');
  }
}
