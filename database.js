const sqlite3 = require('sqlite3').verbose();

// Crear / abrir base de datos
const db = new sqlite3.Database('./database.db');

// Crear tablas
db.serialize(() => {

    // 📌 Tabla asistencias
    db.run(`
        CREATE TABLE IF NOT EXISTS asistencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            proyecto_id TEXT,
            entrada TEXT,
            salida TEXT,
            horas TEXT
        )
    `);

    // 👤 Tabla usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    // 🔑 FORZAR usuario admin
    db.run(`
        INSERT OR IGNORE INTO usuarios (id, username, password)
        VALUES (1, 'admin', '1234')
    `);

});

module.exports = db;