// habitos.js – Operaciones CRUD con Firestore

import { db } from './firebase.js';
import {
  collection, doc, addDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, setDoc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Estructura de datos ───────────────────────────────────────────────────────
//
// Colección: usuarios/{uid}/habitos/{habitoId}
//   nombre:     string   – ej: "Tomar agua"
//   emoji:      string   – ej: "💧"
//   color:      string   – ej: "#4FC3F7"
//   creadoEn:   timestamp
//   activo:     boolean
//
// Colección: usuarios/{uid}/registros/{YYYY-MM-DD_habitoId}
//   habitoId:   string
//   fecha:      string   – "YYYY-MM-DD"
//   completado: boolean
//   hora:       timestamp

// ── Helpers ───────────────────────────────────────────────────────────────────
const habitosRef  = uid => collection(db, 'usuarios', uid, 'habitos');
const registrosRef = uid => collection(db, 'usuarios', uid, 'registros');

export function fechaHoy() {
  return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// ── CREATE: agregar hábito ────────────────────────────────────────────────────
export async function agregarHabito(uid, { nombre, emoji = '✅', color = '#6366f1' }) {
  const ref = await addDoc(habitosRef(uid), {
    nombre,
    emoji,
    color,
    activo:    true,
    creadoEn:  serverTimestamp(),
  });
  return ref.id;
}

// ── READ: obtener hábitos activos (una sola vez) ──────────────────────────────
export async function obtenerHabitos(uid) {
  const q    = query(habitosRef(uid), where('activo', '==', true), orderBy('creadoEn', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── READ: escuchar hábitos en tiempo real ─────────────────────────────────────
export function escucharHabitos(uid, cb) {
  const q = query(habitosRef(uid), where('activo', '==', true), orderBy('creadoEn', 'asc'));
  return onSnapshot(q, snap => {
    const habitos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(habitos);
  });
}

// ── UPDATE: editar hábito ─────────────────────────────────────────────────────
export async function editarHabito(uid, habitoId, cambios) {
  await updateDoc(doc(db, 'usuarios', uid, 'habitos', habitoId), cambios);
}

// ── DELETE: archivar hábito (soft delete) ─────────────────────────────────────
export async function archivarHabito(uid, habitoId) {
  await updateDoc(doc(db, 'usuarios', uid, 'habitos', habitoId), { activo: false });
}

// ── DELETE: eliminar hábito permanentemente ───────────────────────────────────
export async function eliminarHabito(uid, habitoId) {
  await deleteDoc(doc(db, 'usuarios', uid, 'habitos', habitoId));
}

// ── READ: escuchar hábitos archivados en tiempo real ─────────────────────────
export function escucharHabitosArchivados(uid, cb) {
  const q = query(habitosRef(uid), where('activo', '==', false), orderBy('creadoEn', 'asc'));
  return onSnapshot(q, snap => {
    const habitos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(habitos);
  });
}

// ── UPDATE: restaurar hábito archivado ───────────────────────────────────────
export async function restaurarHabito(uid, habitoId) {
  await updateDoc(doc(db, 'usuarios', uid, 'habitos', habitoId), { activo: true });
}

// ── TOGGLE: marcar/desmarcar hábito como completado hoy ──────────────────────
export async function toggleCompletado(uid, habitoId, completado) {
  const fecha  = fechaHoy();
  const docId  = `${fecha}_${habitoId}`;
  const docRef = doc(db, 'usuarios', uid, 'registros', docId);

  await setDoc(docRef, {
    habitoId,
    fecha,
    completado,
    hora: serverTimestamp(),
  }, { merge: true });
}

// ── READ: obtener registros de un día específico ──────────────────────────────
export async function obtenerRegistrosDia(uid, fecha = fechaHoy()) {
  const q    = query(registrosRef(uid), where('fecha', '==', fecha));
  const snap = await getDocs(q);
  // Devuelve un mapa { habitoId: completado }
  const mapa = {};
  snap.docs.forEach(d => {
    const data = d.data();
    mapa[data.habitoId] = data.completado;
  });
  return mapa;
}

// ── READ: escuchar registros del día en tiempo real ───────────────────────────
export function escucharRegistrosDia(uid, fecha = fechaHoy(), cb) {
  const q = query(registrosRef(uid), where('fecha', '==', fecha));
  return onSnapshot(q, snap => {
    const mapa = {};
    snap.docs.forEach(d => {
      const data = d.data();
      mapa[data.habitoId] = data.completado;
    });
    cb(mapa);
  });
}

// ── READ: obtener registros de los últimos N días (para el calendario) ────────
export async function obtenerRegistrosSemana(uid, dias = 7) {
  const fechas = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    fechas.push(d.toISOString().split('T')[0]);
  }

  const snap = await getDocs(
    query(registrosRef(uid), where('fecha', 'in', fechas))
  );

  const resultado = {};
  snap.docs.forEach(d => {
    const data = d.data();
    if (!resultado[data.fecha]) resultado[data.fecha] = {};
    resultado[data.fecha][data.habitoId] = data.completado;
  });
  return resultado;
}
