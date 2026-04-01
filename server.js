const express = require('express');
const cors = require('cors');
const db = require('./database_pg');
const jwt = require('jsonwebtoken'); // 🔐 JWT

const app = express();

app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////
// 🔐 MIDDLEWARE JWT
//////////////////////////////////////////////////

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader) return res.status(403).json({ error: "Token requerido" });

    const token = authHeader.split(" ")[1];

    jwt.verify(token, "CLAVE_SECRETA", (err, user) => {
        if (err) return res.status(403).json({ error: "Token inválido" });

        req.user = user;
        next();
    });
};

//////////////////////////////////////////////////
// 🔧 CREAR TABLAS
//////////////////////////////////////////////////

app.get('/setup-db', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT
            );
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS asistencias (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                proyecto_id INTEGER,
                entrada TIMESTAMP,
                salida TIMESTAMP,
                horas FLOAT
            );
        `);

        await db.query(`
            INSERT INTO usuarios (username, password)
            VALUES ('admin', '123456')
            ON CONFLICT (username) DO NOTHING;
        `);

        res.send("Base de datos lista 🚀");

    } catch (error) {
        console.log("ERROR SETUP:", error);
        res.send("Error creando BD ❌");
    }
});

//////////////////////////////////////////////////
// 🔐 LOGIN CON TOKEN
//////////////////////////////////////////////////

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }

        const user = result.rows[0];

        // 🔥 CREAR TOKEN
        const token = jwt.sign(
            { id: user.id, username: user.username },
            "CLAVE_SECRETA",
            { expiresIn: "2h" }
        );

        res.json({ token });

    } catch (error) {
        console.log("ERROR LOGIN:", error);
        res.status(500).json({ error: "Error servidor" });
    }
});

//////////////////////////////////////////////////
// 👥 USUARIOS (PROTEGIDO)
//////////////////////////////////////////////////

app.get('/admin/users', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, username FROM usuarios ORDER BY id DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.log("ERROR USERS:", error);
        res.json([]);
    }
});

//////////////////////////////////////////////////
// ➕ CREAR USUARIO
//////////////////////////////////////////////////

app.post('/admin/users', verifyToken, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ error: "Campos requeridos" });
    }

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
        console.log("ERROR CREATE USER:", error);
        res.json({ error: error.message });
    }
});

//////////////////////////////////////////////////
// ❌ ELIMINAR USUARIO
//////////////////////////////////////////////////

app.delete('/admin/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query(
            'DELETE FROM usuarios WHERE id = $1',
            [id]
        );

        res.json({ mensaje: "Usuario eliminado" });

    } catch (error) {
        console.log("ERROR DELETE USER:", error);
        res.json({ error: error.message });
    }
});

//////////////////////////////////////////////////
// ✏️ EDITAR USUARIO
//////////////////////////////////////////////////

app.put('/admin/users/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;

    try {
        await db.query(
            'UPDATE usuarios SET username = $1, password = $2 WHERE id = $3',
            [username, password, id]
        );

        res.json({ mensaje: "Usuario actualizado" });

    } catch (error) {
        console.log("ERROR UPDATE USER:", error);
        res.json({ error: error.message });
    }
});

//////////////////////////////////////////////////
// 📊 ASISTENCIAS
//////////////////////////////////////////////////

app.get('/admin/attendances', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM asistencias ORDER BY id DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.log("ERROR ATTENDANCES:", error);
        res.json([]);
    }
});

//////////////////////////////////////////////////
// 🚨 ALERTAS
//////////////////////////////////////////////////

app.get('/admin/alerts', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM asistencias WHERE horas > 8 ORDER BY id DESC'
        );

        res.json(result.rows);

    } catch (error) {
        console.log("ERROR ALERTS:", error);
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