const express = require('express');
const cors = require('cors');
const db = require('./database');
const { getDistance } = require('geolib');

const app = express();

app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////
// 🔐 LOGIN
//////////////////////////////////////////////////

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        `SELECT * FROM usuarios WHERE username = ? AND password = ?`,
        [username, password],
        (err, row) => {
            if (err) {
                console.log("ERROR LOGIN:", err);
                return res.json({ success: false });
            }

            if (!row) {
                return res.json({ success: false });
            }

            res.json({ success: true, user: row });
        }
    );
});

//////////////////////////////////////////////////
// 👤 CREAR ADMIN
//////////////////////////////////////////////////

app.get('/create-admin', (req, res) => {
    db.run(
        `INSERT OR IGNORE INTO usuarios (username, password)
         VALUES ('admin', '123456')`,
        function (err) {
            if (err) {
                return res.send(err.message);
            }

            res.send("Admin listo");
        }
    );
});

//////////////////////////////////////////////////
// 🔄 RESET PASSWORD ADMIN
//////////////////////////////////////////////////

app.get('/reset-admin', (req, res) => {
    db.run(
        `UPDATE usuarios SET password = '123456' WHERE username = 'admin'`,
        function (err) {
            if (err) {
                return res.send(err.message);
            }

            res.send("Password reseteada correctamente");
        }
    );
});

//////////////////////////////////////////////////
// 🚨 ALERTAS (🔥 SOLUCIÓN A TU ERROR)
//////////////////////////////////////////////////

app.get('/admin/alerts', (req, res) => {
    db.all(
        `SELECT * FROM asistencias WHERE horas > 8 ORDER BY id DESC`,
        [],
        (err, rows) => {
            if (err) {
                console.log("ERROR ALERTS:", err);
                return res.json([]);
            }

            res.json(rows);
        }
    );
});

//////////////////////////////////////////////////
// ✅ CHECK IN
//////////////////////////////////////////////////

app.post('/checkin', (req, res) => {

    const { user_id, proyecto_id, lat, lng, fecha } = req.body;

    db.get(
        `SELECT * FROM proyectos WHERE id = ?`,
        [proyecto_id],
        (err, proyecto) => {

            if (err || !proyecto) {
                return res.json({ error: "Proyecto no encontrado" });
            }

            const distancia = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: proyecto.lat, longitude: proyecto.lng }
            );

            if (distancia > 500) {
                return res.json({ error: "Fuera de rango (500m)" });
            }

            const entrada = fecha || new Date().toISOString();

            db.run(
                `INSERT INTO asistencias (user_id, proyecto_id, entrada)
                 VALUES (?, ?, ?)`,
                [user_id, proyecto_id, entrada],
                function (err) {
                    if (err) {
                        return res.json({ error: err.message });
                    }

                    res.json({ mensaje: "Check-in guardado" });
                }
            );
        }
    );
});

//////////////////////////////////////////////////
// 🚨 CHECK OUT
//////////////////////////////////////////////////

app.post('/checkout', (req, res) => {

    const { user_id, lat, lng, fecha } = req.body;

    db.get(
        `SELECT a.*, p.lat as proyecto_lat, p.lng as proyecto_lng
         FROM asistencias a
         JOIN proyectos p ON a.proyecto_id = p.id
         WHERE a.user_id = ? AND a.salida IS NULL
         ORDER BY a.id DESC LIMIT 1`,
        [user_id],
        (err, row) => {

            if (err) {
                return res.json({ error: err.message });
            }

            if (!row) {
                return res.json({ mensaje: "No hay entrada activa" });
            }

            const distancia = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: row.proyecto_lat, longitude: row.proyecto_lng }
            );

            const fueraDeRango = distancia > 500;

            const salida = fecha ? new Date(fecha) : new Date();
            const entrada = new Date(row.entrada);

            const horas = ((salida - entrada) / (1000 * 60 * 60)).toFixed(2);

            db.run(
                `UPDATE asistencias
                 SET salida = ?, horas = ?
                 WHERE id = ?`,
                [salida.toISOString(), horas, row.id],
                (err) => {
                    if (err) {
                        return res.json({ error: err.message });
                    }

                    res.json({
                        mensaje: "Check-out OK",
                        horas,
                        alerta: fueraDeRango
                    });
                }
            );
        }
    );
});

//////////////////////////////////////////////////
// 📊 ASISTENCIAS
//////////////////////////////////////////////////

app.get('/asistencias', (req, res) => {
    db.all(
        `SELECT * FROM asistencias ORDER BY id DESC`,
        [],
        (err, rows) => {
            if (err) return res.json([]);
            res.json(rows);
        }
    );
});

//////////////////////////////////////////////////
// 🚨 ALERTA SIMPLE
//////////////////////////////////////////////////

app.post('/alerta', (req, res) => {
    console.log("🚨 ALERTA:", req.body);
    res.json({ ok: true });
});

//////////////////////////////////////////////////
// 🚀 SERVIDOR
//////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});