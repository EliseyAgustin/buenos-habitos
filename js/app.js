// app.js – con Firebase real

import { registrar, login, escucharSesion } from './auth.js';
import {
  iniciarUI, limpiarUI,
  mostrarVista, mostrarErrorAuth,
  traducirError, iniciarFormHabito, iniciarLogout, iniciarModalEditar
} from './ui.js';

// ── Errores globales ──────────────────────────────────────────────────────────
window.addEventListener('unhandledrejection', event => {
  console.error('Promesa rechazada sin manejar:', event.reason);
});

// ── Service Worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('sw.js');
    } catch (err) {
      console.error('SW error:', err);
    }
  });
}

// ── Escuchar sesión ───────────────────────────────────────────────────────────
escucharSesion(user => {
  if (user) {
    iniciarUI(user);
    iniciarFormHabito();
    iniciarLogout();
    iniciarModalEditar();
  } else {
    limpiarUI();
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Ingresando...';
  try {
    await login(email, password);
  } catch (err) {
    mostrarErrorAuth(traducirError(err.code));
  } finally {
    btn.disabled = false; btn.textContent = 'Ingresar';
  }
});

// ── Registro ──────────────────────────────────────────────────────────────────
document.getElementById('form-registro').addEventListener('submit', async e => {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = e.target.querySelector('button[type="submit"]');
  if (password !== document.getElementById('reg-password2').value) {
    mostrarErrorAuth('Las contraseñas no coinciden.'); return;
  }
  btn.disabled = true; btn.textContent = 'Registrando...';
  try {
    await registrar(nombre, email, password);
    e.target.reset();
    document.getElementById('panel-registro').classList.add('oculto');
    document.getElementById('panel-login').classList.remove('oculto');
  } catch (err) {
    mostrarErrorAuth(traducirError(err.code));
  } finally {
    btn.disabled = false; btn.textContent = 'Crear cuenta';
  }
});

// ── Alternar login / registro ─────────────────────────────────────────────────
document.getElementById('ir-registro').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('panel-login').classList.add('oculto');
  document.getElementById('panel-registro').classList.remove('oculto');
  document.getElementById('error-auth').style.display = 'none';
});

document.getElementById('ir-login').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('panel-registro').classList.add('oculto');
  document.getElementById('panel-login').classList.remove('oculto');
  document.getElementById('error-auth').style.display = 'none';
});

// ── Navegación ────────────────────────────────────────────────────────────────
document.getElementById('btn-nuevo-habito').addEventListener('click', () => {
  mostrarVista('nuevo-habito');
});

document.getElementById('btn-cancelar-habito').addEventListener('click', () => {
  mostrarVista('dashboard');
});

// ── Banner offline ────────────────────────────────────────────────────────
const bannerOffline = document.getElementById('banner-offline');
function actualizarBannerOffline() {
  bannerOffline.classList.toggle('oculto', navigator.onLine);
}
actualizarBannerOffline();
window.addEventListener('online',  actualizarBannerOffline);
window.addEventListener('offline', actualizarBannerOffline);

// ── Instalar PWA ──────────────────────────────────────────────────────────────
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('btn-instalar').style.display = 'flex';
});
document.getElementById('btn-instalar').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('btn-instalar').style.display = 'none';
});