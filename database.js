const sqlite3 = require('sqlite3').verbose();

// Crear / abrir base de datos
const db = new sqlite3.Database('./database.db');

// Crear tablas
db.serialize(() => {

    //////////////////////////////////////////////
    // 📌 TABLA ASISTENCIAS
    //////////////////////////////////////////////
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

    //////////////////////////////////////////////
    // 👤 TABLA USUARIOS
    //////////////////////////////////////////////
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    `);

    //////////////////////////////////////////////
    // 📍 TABLA PROYECTOS (NUEVA)
    //////////////////////////////////////////////
    db.run(`
        CREATE TABLE IF NOT EXISTS proyectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            lat REAL,
            lng REAL
        )
    `);

    //////////////////////////////////////////////
    // 🚨 TABLA ALERTAS (NUEVA)
    //////////////////////////////////////////////
    db.run(`
        CREATE TABLE IF NOT EXISTS alertas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            lat REAL,
            lng REAL,
            mensaje TEXT,
            fecha TEXT
        )
    `);

    //////////////////////////////////////////////
    // 👤 CREAR USUARIO ADMIN SI NO EXISTE
    //////////////////////////////////////////////
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

    //////////////////////////////////////////////
    // 📍 CREAR PROYECTO DE PRUEBA (IMPORTANTE)
    //////////////////////////////////////////////
    db.get(
        `SELECT * FROM proyectos WHERE id = 1`,
        [],
        (err, row) => {
            if (!row) {
                db.run(
                    `INSERT INTO proyectos (nombre, lat, lng)
                     VALUES (?, ?, ?)`,
                    [
                        'Proyecto Principal',
                        19.4326,   // 🔥 CAMBIA POR TU UBICACIÓN REAL
                        -99.1332
                    ],
                    (err) => {
                        if (err) {
                            console.log("Error creando proyecto:", err);
                        } else {
                            console.log("Proyecto creado");
                        }
                    }
                );
            }
        }
    );

});

module.exports = db;