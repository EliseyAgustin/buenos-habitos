// auth.js – Registro, login y logout con Firebase Auth

import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// ── Registrar usuario nuevo ───────────────────────────────────────────────────
export async function registrar(nombre, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Guardar el nombre en el perfil de Auth
  await updateProfile(cred.user, { displayName: nombre });
  return cred.user;
}

// ── Iniciar sesión ────────────────────────────────────────────────────────────
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Cerrar sesión ─────────────────────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── Escuchar cambios de sesión ────────────────────────────────────────────────
// cb recibe el usuario (o null si no hay sesión)
export function escucharSesion(cb) {
  return onAuthStateChanged(auth, cb);
}
