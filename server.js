const express = require('express');
const cors = require('cors');
const db = require('./database_pg'); // 🔥 CAMBIO IMPORTANTE

const app = express();

app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////
// 🔐 LOGIN
//////////////////////////////////////////////////

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length === 0) {
            return res.json({ success: false });
        }

        res.json({ success: true, user: result.rows[0] });

    } catch (error) {
        console.log(error);
        res.json({ success: false });
    }
});

//////////////////////////////////////////////////
// 👥 OBTENER USUARIOS
//////////////////////////////////////////////////

app.get('/admin/users', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username FROM usuarios ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.json([]);
    }
});

//////////////////////////////////////////////////
// ➕ CREAR USUARIO
//////////////////////////////////////////////////

app.post('/admin/users', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query(
            'INSERT INTO usuarios (username, password) VALUES ($1, $2) RETURNING id',
            [username, password]
        );

        res.json({
            mensaje: "Usuario creado",
            id: result.rows[0].id
        });

    } catch (error) {
        console.log(error);
        res.json({ error: error.message });
    }
});

//////////////////////////////////////////////////
// ❌ ELIMINAR USUARIO
//////////////////////////////////////////////////

app.delete('/admin/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            'DELETE FROM usuarios WHERE id = $1',
            [id]
        );

        res.json({ mensaje: "Usuario eliminado" });

    } catch (error) {
        console.log(error);
        res.json({ error: error.message });
    }
});

//////////////////////////////////////////////////
// ✏️ EDITAR USUARIO
//////////////////////////////////////////////////

app.put('/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    try {
        await db.query(
            'UPDATE usuarios SET username = $1, password = $2 WHERE id = $3',
            [username, password, id]
        );

        res.json({ mensaje: "Usuario actualizado" });

    } catch (error) {
        console.log(error);
        res.json({ error: error.message });
    }
});

//////////////////////////////////////////////////
// 📊 ASISTENCIAS
//////////////////////////////////////////////////

app.get('/admin/attendances', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM asistencias ORDER BY id DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.log(error);
        res.json([]);
    }
});

//////////////////////////////////////////////////
// 🚨 ALERTAS
//////////////////////////////////////////////////

app.get('/admin/alerts', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM asistencias WHERE horas > 8 ORDER BY id DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.log(error);
        res.json([]);
    }
});

//////////////////////////////////////////////////
// 🚀 SERVIDOR
//////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});