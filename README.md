# Buenos Hábitos

PWA para registrar y hacer seguimiento de hábitos diarios. Desarrollada como trabajo práctico para la materia **Dispositivos Móviles** — Tecnicatura en Tecnologías Web (UNO).

**Demo en vivo:** https://buenos-habitos-e2a89.web.app

---

## Funcionalidades

- Registro de usuario y login con email/contraseña (Firebase Auth)
- Crear hábitos con nombre, emoji y color personalizado
- Marcar hábitos como completados por día
- Progreso diario y promedio semanal en tiempo real
- Archivar y restaurar hábitos
- Funciona offline (caché con Service Worker)
- Instalable como app nativa (PWA)

---

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML / CSS / JavaScript | Frontend sin frameworks |
| Firebase Auth | Autenticación de usuarios |
| Cloud Firestore | Base de datos en tiempo real |
| Firebase Hosting | Deploy y HTTPS |
| Service Worker | Caché offline y soporte PWA |
| Web App Manifest | Instalación como app nativa |

---

## Estructura del proyecto

```
buenos-habitos/
├── index.html          # Única página (SPA)
├── sw.js               # Service Worker
├── manifest.json       # Configuración PWA
├── css/
│   └── styles.css      # Estilos globales (dark mode)
├── js/
│   ├── app.js          # Punto de entrada, navegación, instalación PWA
│   ├── auth.js         # Login, registro, sesión
│   ├── firebase.js     # Inicialización Firebase
│   ├── habitos.js      # CRUD Firestore (hábitos y registros)
│   ├── ui.js           # Renderizado y eventos de interfaz
│   └── cache.js        # Caché local (localStorage)
└── icons/              # Íconos PWA (192px, 512px, favicon)
```

---

## Modelo de datos (Firestore)

```
usuarios/
  {uid}/
    habitos/
      {habitoId}
        nombre:    string   — "Tomar agua"
        emoji:     string   — "💧"
        color:     string   — "#4FC3F7"
        activo:    boolean
        creadoEn:  timestamp

    registros/
      {YYYY-MM-DD_habitoId}
        habitoId:   string
        fecha:      string   — "YYYY-MM-DD"
        completado: boolean
        hora:       timestamp
```

---

## Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/EliseyAgustin/buenos-habitos.git
cd buenos-habitos

# Instalar dependencias de Firebase CLI
npm install

# Iniciar servidor local (requiere Firebase CLI)
npx firebase serve
```

> La app usa módulos ES nativos del CDN de Firebase, por lo que necesita correr sobre un servidor HTTP (no funciona abriendo el archivo directamente).

---

## Deploy

```bash
npx firebase deploy
```

Requiere tener configurado Firebase CLI y estar autenticado con `firebase login`.

---

## Autor

**Agustín Elisey** — [EliseyAgustin](https://github.com/EliseyAgustin)
