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

    console.log("LOGIN:", username, password);

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
// CHECK IN
//////////////////////////////////////////////////

app.post('/checkin', (req, res) => {
    const { user_id, proyecto_id } = req.body;

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

    db.get(
        `SELECT * FROM asistencias
         WHERE user_id = ? AND salida IS NULL
         ORDER BY id DESC LIMIT 1`,
        [user_id],
        (err, row) => {

            if (err) {
                console.log("ERROR BUSQUEDA:", err);
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
                        console.log("ERROR CHECKOUT:", err);
                        return res.json({ error: err.message });
                    }

                    res.json({ mensaje: "Check-out OK", horas });
                }
            );
        }
    );
});

//////////////////////////////////////////////////
// GET ASISTENCIAS
//////////////////////////////////////////////////

app.get('/asistencias', (req, res) => {
    db.all(`SELECT * FROM asistencias`, [], (err, rows) => {
        if (err) {
            console.log("ERROR GET:", err);
            return res.json([]);
        }
        res.json(rows);
    });
});

//////////////////////////////////////////////////
// 🔥 PUERTO CORRECTO PARA RENDER
//////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});