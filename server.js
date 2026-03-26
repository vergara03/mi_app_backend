const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////
// 🔐 LOGIN
//////////////////////////////////////////////////

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    console.log("LOGIN INTENTO:", username, password);

    db.get(
        `SELECT * FROM usuarios WHERE username = ? AND password = ?`,
        [username, password],
        (err, row) => {
            if (err) {
                console.log("ERROR LOGIN:", err);
                return res.json({ success: false, error: err.message });
            }

            if (!row) {
                console.log("LOGIN FALLIDO");
                return res.json({ success: false });
            }

            console.log("LOGIN EXITOSO:", row);

            res.json({
                success: true,
                user: row
            });
        }
    );
});

//////////////////////////////////////////////////
// CHECK IN
//////////////////////////////////////////////////

app.post('/checkin', (req, res) => {
    const { user_id, proyecto_id } = req.body;

    console.log("CHECK IN:", user_id);

    const entrada = new Date().toISOString();

    db.run(
        `INSERT INTO asistencias (user_id, proyecto_id, entrada)
         VALUES (?, ?, ?)`,
        [user_id, proyecto_id, entrada],
        function (err) {
            if (err) {
                console.log("ERROR CHECKIN:", err);
                return res.json({ error: err.message });
            }

            res.json({ mensaje: "Check-in guardado" });
        }
    );
});

//////////////////////////////////////////////////
// CHECK OUT
//////////////////////////////////////////////////

app.post('/checkout', (req, res) => {
    const { user_id } = req.body;

    console.log("CHECK OUT:", user_id);

    db.get(
        `SELECT * FROM asistencias
         WHERE user_id = ? AND salida IS NULL
         ORDER BY id DESC LIMIT 1`,
        [user_id],
        (err, row) => {

            if (err) {
                console.log("ERROR CHECKOUT:", err);
                return res.json({ error: err.message });
            }

            if (!row) {
                return res.json({ mensaje: "No hay entrada activa" });
            }

            const salida = new Date();
            const entrada = new Date(row.entrada);

            const horas = ((salida - entrada) / (1000 * 60 * 60)).toFixed(2);

            db.run(
                `UPDATE asistencias
                 SET salida = ?, horas = ?
                 WHERE id = ?`,
                [salida.toISOString(), horas, row.id],
                (err) => {

                    if (err) {
                        console.log("ERROR UPDATE:", err);
                        return res.json({ error: err.message });
                    }

                    res.json({
                        mensaje: "Check-out OK",
                        horas
                    });
                }
            );
        }
    );
});

//////////////////////////////////////////////////
// GET ASISTENCIAS
//////////////////////////////////////////////////

app.get('/asistencias', (req, res) => {
    db.all(`SELECT * FROM asistencias ORDER BY id DESC`, [], (err, rows) => {

        if (err) {
            console.log("ERROR GET:", err);
            return res.json({ error: err.message });
        }

        res.json(rows);
    });
});

//////////////////////////////////////////////////
// SERVIDOR
//////////////////////////////////////////////////

app.listen(3000, '0.0.0.0', () => {
    console.log("🚀 Servidor corriendo en http://192.168.12.3:3000");
});