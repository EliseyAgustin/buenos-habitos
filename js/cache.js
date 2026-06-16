// cache.js – Persistencia local con localStorage (soporte offline)

const keyHabitos = uid => `bh_habitos_${uid}`;
const keySemana  = uid => `bh_semana_${uid}`;

export function guardarHabitosLocal(uid, habitos) {
  try { localStorage.setItem(keyHabitos(uid), JSON.stringify(habitos)); } catch (_) {}
}

export function cargarHabitosLocal(uid) {
  try { return JSON.parse(localStorage.getItem(keyHabitos(uid))) || []; } catch { return []; }
}

export function guardarSemanaLocal(uid, semana) {
  try { localStorage.setItem(keySemana(uid), JSON.stringify(semana)); } catch (_) {}
}

export function cargarSemanaLocal(uid) {
  try { return JSON.parse(localStorage.getItem(keySemana(uid))) || {}; } catch { return {}; }
}
