import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC8bDqoiznYhRVsYJvcyS4eRJ8T0walc_g",
  authDomain: "buenos-habitos-e2a89.firebaseapp.com",
  projectId: "buenos-habitos-e2a89",
  storageBucket: "buenos-habitos-e2a89.firebasestorage.app",
  messagingSenderId: "673451727667",
  appId: "1:673451727667:web:ac262dc15c68f0146fbc46"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);