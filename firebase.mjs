// firebase.mjs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js';

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
export const db = getFirestore(app);
export const storage = getStorage(app);
