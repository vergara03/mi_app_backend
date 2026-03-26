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

    // 🔥 ASEGURAR USUARIO ADMIN (FORMA PRO)
    db.get(
        `SELECT * FROM usuarios WHERE username = ?`,
        ['admin'],
        (err, row) => {
            if (!row) {
                db.run(
                    `INSERT INTO usuarios (username, password)
                     VALUES (?, ?)`,
                    ['admin', '1234'],
                    (err) => {
                        if (err) {
                            console.log("Error creando admin:", err);
                        } else {
                            console.log("Usuario admin creado");
                        }
                    }
                );
            } else {
                console.log("Usuario admin ya existe");
            }
        }
    );

});

module.exports = db;