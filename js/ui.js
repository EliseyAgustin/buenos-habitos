// ui.js

import { logout } from './auth.js';
import {
  agregarHabito, archivarHabito, eliminarHabito, editarHabito,
  toggleCompletado, escucharHabitos,
  escucharRegistrosDia, obtenerRegistrosSemana, fechaHoy,
  escucharHabitosArchivados, restaurarHabito
} from './habitos.js';
import {
  guardarHabitosLocal, cargarHabitosLocal,
  guardarSemanaLocal,  cargarSemanaLocal
} from './cache.js';

// ── Helpers de seguridad ──────────────────────────────────────────────────────

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validarColor(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#7c6ff7';
}

// ── Estado ────────────────────────────────────────────────────────────────────

let unsubHabitos    = null;
let unsubRegistros  = null;
let unsubArchivados = null;
let usuarioActual   = null;
let habitoEditandoId = null;

export function iniciarUI(user) {
  usuarioActual = user;
  document.getElementById('nombre-usuario').textContent = user.displayName || user.email;
  mostrarVista('dashboard');
  suscribirDatos();
}

export function limpiarUI() {
  if (unsubHabitos)    { unsubHabitos();    unsubHabitos    = null; }
  if (unsubRegistros)  { unsubRegistros();  unsubRegistros  = null; }
  if (unsubArchivados) { unsubArchivados(); unsubArchivados = null; }
  usuarioActual = null;
  document.getElementById('panel-registro').classList.add('oculto');
  document.getElementById('panel-login').classList.remove('oculto');
  mostrarVista('auth');
}

export function mostrarVista(nombre) {
  document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
  const vista = document.getElementById(`vista-${nombre}`);
  if (vista) vista.classList.add('activa');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ultimosSieteDias() {
  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dias.push(d.toISOString().split('T')[0]);
  }
  return dias;
}

// ── Datos en tiempo real ──────────────────────────────────────────────────────

async function suscribirDatos() {
  const uid = usuarioActual.uid;
  const hoy = fechaHoy();

  // Cancelar suscripciones previas antes de re-suscribir
  if (unsubHabitos)    { unsubHabitos();    unsubHabitos    = null; }
  if (unsubRegistros)  { unsubRegistros();  unsubRegistros  = null; }
  if (unsubArchivados) { unsubArchivados(); unsubArchivados = null; }

  // Cargar caché local primero → permite ver datos sin conexión
  let habitos  = cargarHabitosLocal(uid);
  let semana   = cargarSemanaLocal(uid);
  let registros = semana[hoy] || {};

  if (habitos.length > 0) {
    renderizarHabitos(habitos, registros, semana);
    renderizarProgreso(habitos, registros, semana);
  }

  try {
    const semanaFirebase = await obtenerRegistrosSemana(uid);
    semana = { ...semana, ...semanaFirebase };
    guardarSemanaLocal(uid, semana);
    registros = semana[hoy] || {};
  } catch (_) {}

  unsubHabitos = escucharHabitos(uid, h => {
    habitos = h;
    guardarHabitosLocal(uid, h);
    renderizarHabitos(habitos, registros, semana);
    renderizarProgreso(habitos, registros, semana);
  });

  unsubRegistros = escucharRegistrosDia(uid, hoy, r => {
    registros  = r;
    semana[hoy] = r;
    guardarSemanaLocal(uid, semana);
    renderizarHabitos(habitos, registros, semana);
    renderizarProgreso(habitos, registros, semana);
  });

  unsubArchivados = escucharHabitosArchivados(uid, renderizarArchivados);
}

// ── Render hábitos ────────────────────────────────────────────────────────────

function renderizarHabitos(habitos, registros, semana) {
  const lista = document.getElementById('lista-habitos');
  if (!lista) return;

  if (habitos.length === 0) {
    lista.innerHTML = `
      <div class="estado-vacio">
        <span class="emoji-vacio">🌱</span>
        <p>Todavía no tenés hábitos.<br>¡Agregá uno para empezar!</p>
      </div>`;
    return;
  }

  const dias       = ultimosSieteDias();
  const letrasDia  = ['D','L','M','X','J','V','S'];

  lista.innerHTML = habitos.map(h => {
    const completado = registros[h.id] === true;
    const color      = validarColor(h.color);
    const nombre     = escapeHTML(h.nombre);
    const emoji      = escapeHTML(h.emoji || '✅');
    const eid        = escapeHTML(h.id);

    const dots = dias.map(fecha => {
      const ok    = semana[fecha] && semana[fecha][h.id] === true;
      const letra = letrasDia[new Date(fecha + 'T12:00:00').getDay()];
      return `<span class="dot${ok ? ' dot-ok' : ''}" title="${fecha}">${letra}</span>`;
    }).join('');

    return `
      <div class="habito-card ${completado ? 'completado' : ''}" data-id="${eid}" style="--card-color:${color}">
        <button class="btn-toggle" data-id="${eid}" data-completado="${completado}"
          aria-label="${completado ? 'Desmarcar' : 'Completar'} ${nombre}"
          style="background:${color}22; border-color:${completado ? 'var(--green)' : color + '66'}">
          <span class="habito-emoji">${emoji}</span>
          <span class="check-icon">${completado ? '✓' : ''}</span>
        </button>
        <div class="habito-info">
          <span class="habito-nombre">${nombre}</span>
          <div class="habito-dots">${dots}</div>
        </div>
        <div class="habito-acciones">
          <button class="btn-editar" title="Editar" aria-label="Editar ${nombre}"
            data-id="${eid}"
            data-nombre="${escapeHTML(h.nombre)}"
            data-emoji="${emoji}"
            data-color="${color}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-archivar" data-id="${eid}" title="Archivar" aria-label="Archivar ${nombre}">
            <i class="fa-solid fa-box-archive"></i>
          </button>
          <button class="btn-eliminar" data-id="${eid}" title="Eliminar" aria-label="Eliminar ${nombre}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');

  lista.querySelectorAll('.btn-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id         = btn.dataset.id;
      const completado = btn.dataset.completado === 'true';
      btn.disabled     = true;
      try {
        await toggleCompletado(usuarioActual.uid, id, !completado);
      } catch (err) {
        console.error('Error al actualizar hábito:', err);
        btn.disabled = false;
      }
    });
  });

  lista.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      abrirEditModal({
        id:     btn.dataset.id,
        nombre: btn.dataset.nombre,
        emoji:  btn.dataset.emoji,
        color:  btn.dataset.color,
      });
    });
  });

  lista.querySelectorAll('.btn-archivar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Archivar este hábito?')) return;
      btn.disabled = true;
      try {
        await archivarHabito(usuarioActual.uid, btn.dataset.id);
      } catch (err) {
        console.error('Error al archivar:', err);
        btn.disabled = false;
        alert('Error al archivar. Verificá tu conexión.');
      }
    });
  });

  lista.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este hábito permanentemente? Esta acción no se puede deshacer.')) return;
      btn.disabled = true;
      try {
        await eliminarHabito(usuarioActual.uid, btn.dataset.id);
      } catch (err) {
        console.error('Error al eliminar:', err);
        btn.disabled = false;
        alert('Error al eliminar. Verificá tu conexión.');
      }
    });
  });
}

// ── Render progreso ───────────────────────────────────────────────────────────

function renderizarProgreso(habitos, registros, semana) {
  const contenedor = document.getElementById('progreso-dia');
  if (!contenedor || habitos.length === 0) {
    if (contenedor) contenedor.innerHTML = '';
    return;
  }

  const total      = habitos.length;
  const completados = habitos.filter(h => registros[h.id] === true).length;
  const pct        = Math.round((completados / total) * 100);

  // Promedio semanal
  const dias = ultimosSieteDias();
  let totalSemana = 0;
  dias.forEach(fecha => {
    if (semana[fecha]) {
      habitos.forEach(h => { if (semana[fecha][h.id] === true) totalSemana++; });
    }
  });
  const pctSemana = Math.round((totalSemana / (habitos.length * dias.length)) * 100);

  contenedor.innerHTML = `
    <div class="progreso-texto">
      <span>${completados} / ${total} hábitos hoy</span>
      <span class="pct">${pct}%</span>
    </div>
    <div class="progreso-barra">
      <div class="progreso-fill" style="width: ${pct}%"></div>
    </div>
    <p class="progreso-mensaje">${mensajeProgreso(pct)}</p>
    <div class="stats-semana">
      <span>Promedio esta semana</span>
      <span class="stat-valor">${pctSemana}%</span>
    </div>`;
}

function mensajeProgreso(pct) {
  if (pct === 100) return '🎉 ¡Completaste todos tus hábitos hoy!';
  if (pct >= 75)  return '💪 ¡Casi llegás! Seguí así.';
  if (pct >= 50)  return '👍 Buen ritmo, vas por la mitad.';
  if (pct > 0)    return '🌱 Buen comienzo, seguí adelante.';
  return '☀️ Nuevo día, nuevas oportunidades.';
}

// ── Modal de edición ──────────────────────────────────────────────────────────

function abrirEditModal(habito) {
  habitoEditandoId = habito.id;
  document.getElementById('edit-nombre').value = habito.nombre;
  document.getElementById('edit-emoji').value  = habito.emoji;
  document.getElementById('edit-color').value  = habito.color || '#7c6ff7';
  document.getElementById('modal-edit').classList.add('activo');
  document.getElementById('edit-nombre').focus();
}

function cerrarEditModal() {
  habitoEditandoId = null;
  document.getElementById('modal-edit').classList.remove('activo');
}

export function iniciarModalEditar() {
  const modal = document.getElementById('modal-edit');
  if (!modal || modal.dataset.initialized) return;
  modal.dataset.initialized = 'true';

  document.getElementById('btn-cerrar-modal').addEventListener('click', cerrarEditModal);

  modal.addEventListener('click', e => { if (e.target === modal) cerrarEditModal(); });

  document.getElementById('form-editar').addEventListener('submit', async e => {
    e.preventDefault();
    if (!habitoEditandoId) return;
    const nombre = document.getElementById('edit-nombre').value.trim();
    const emoji  = document.getElementById('edit-emoji').value.trim() || '✅';
    const color  = document.getElementById('edit-color').value || '#7c6ff7';
    if (!nombre) return;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await editarHabito(usuarioActual.uid, habitoEditandoId, { nombre, emoji, color });
      cerrarEditModal();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar';
    }
  });

  document.getElementById('btn-archivar-modal').addEventListener('click', async () => {
    if (!habitoEditandoId || !confirm('¿Archivar este hábito?')) return;
    await archivarHabito(usuarioActual.uid, habitoEditandoId);
    cerrarEditModal();
  });
}

// ── Formulario nuevo hábito ───────────────────────────────────────────────────

export function iniciarFormHabito() {
  const form = document.getElementById('form-habito');
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = 'true';

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nombre = document.getElementById('input-nombre-habito').value.trim();
    const emoji  = document.getElementById('input-emoji').value.trim() || '✅';
    const color  = document.getElementById('input-color').value || '#7c6ff7';
    if (!nombre) return;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Guardando...';
    try {
      await agregarHabito(usuarioActual.uid, { nombre, emoji, color });
      form.reset();
      mostrarVista('dashboard');
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Guardar hábito';
    }
  });
}

// ── Render hábitos archivados ─────────────────────────────────────────────────

function renderizarArchivados(archivados) {
  const seccion = document.getElementById('seccion-archivados');
  if (!seccion) return;

  if (archivados.length === 0) {
    seccion.classList.add('oculta');
    return;
  }

  seccion.classList.remove('oculta');

  const lista = document.getElementById('lista-archivados');
  lista.innerHTML = archivados.map(h => {
    const color  = validarColor(h.color);
    const nombre = escapeHTML(h.nombre);
    const emoji  = escapeHTML(h.emoji || '✅');
    const eid    = escapeHTML(h.id);
    return `
      <div class="habito-card archivado" data-id="${eid}" style="--card-color:${color}">
        <div class="btn-toggle archivado-icono" style="background:${color}22; border-color:${color}44">
          <span class="habito-emoji">${emoji}</span>
        </div>
        <div class="habito-info">
          <span class="habito-nombre">${nombre}</span>
          <span class="habito-estado">Archivado</span>
        </div>
        <button class="btn-restaurar" data-id="${eid}" title="Restaurar" aria-label="Restaurar ${nombre}">↩</button>
      </div>`;
  }).join('');

  lista.querySelectorAll('.btn-restaurar').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      try {
        await restaurarHabito(usuarioActual.uid, btn.dataset.id);
      } catch (err) {
        console.error('Error al restaurar:', err);
        btn.disabled = false;
        alert('Error al restaurar. Verificá tu conexión.');
      }
    });
  });

  // Toggle mostrar/ocultar lista
  const toggle = document.getElementById('toggle-archivados');
  if (!toggle.dataset.initialized) {
    toggle.dataset.initialized = 'true';
    toggle.addEventListener('click', () => {
      lista.classList.toggle('contraida');
      toggle.classList.toggle('rotado');
    });
  }
}

export function iniciarLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn || btn.dataset.initialized) return;
  btn.dataset.initialized = 'true';
  btn.addEventListener('click', async () => { await logout(); });
}

export function mostrarErrorAuth(mensaje) {
  const el = document.getElementById('error-auth');
  if (!el) return;
  el.textContent = mensaje;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

export function traducirError(code) {
  const errores = {
    'auth/email-already-in-use':   'Ese email ya está registrado.',
    'auth/invalid-email':          'El email no es válido.',
    'auth/weak-password':          'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-credential':     'Email o contraseña incorrectos.',
    'auth/too-many-requests':      'Demasiados intentos. Esperá unos minutos.',
    'auth/network-request-failed': 'Sin conexión. Verificá tu red.',
  };
  return errores[code] || 'Ocurrió un error. Intentalo de nuevo.';
}
