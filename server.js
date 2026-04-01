const express = require('express');
const cors = require('cors');
const db = require('./database_pg');
const jwt = require('jsonwebtoken');

const app = express();

//////////////////////////////////////////////////
// 🔥 CORS CORREGIDO (MUY IMPORTANTE)
//////////////////////////////////////////////////

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 🔥 MANEJO PREFLIGHT
app.options('*', cors());

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
// 🔧 SETUP DB
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
                horas FLOAT,
                fuera_zona BOOLEAN DEFAULT false
            );
        `);

        await db.query(`
            INSERT INTO usuarios (username, password)
            VALUES ('admin', '123456')
            ON CONFLICT (username) DO NOTHING;
        `);

        res.send("BD lista");

    } catch (error) {
        console.log(error);
        res.send("Error BD");
    }
});

//////////////////////////////////////////////////
// LOGIN
//////////////////////////////////////////////////

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const result = await db.query(
        'SELECT * FROM usuarios WHERE username=$1 AND password=$2',
        [username, password]
    );

    if (result.rows.length === 0) {
        return res.status(401).json({ success: false });
    }

    const user = result.rows[0];

    const token = jwt.sign(
        { id: user.id },
        "CLAVE_SECRETA",
        { expiresIn: "2h" }
    );

    res.json({
        success: true,
        user,
        token
    });
});

//////////////////////////////////////////////////
// 🔥 ASISTENCIAS (CLAVE)
//////////////////////////////////////////////////

app.post('/asistencias', async (req, res) => {
    const { user_id, proyecto_id, entrada, horas, fuera_zona } = req.body;

    try {
        await db.query(
            `INSERT INTO asistencias (user_id, proyecto_id, entrada, horas, fuera_zona)
             VALUES ($1, $2, $3, $4, $5)`,
            [user_id, proyecto_id, entrada, horas || 0, fuera_zona]
        );

        console.log("📥 GUARDADO:", req.body);

        res.json({ ok: true });

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error insert" });
    }
});

app.get('/asistencias', async (req, res) => {
    const result = await db.query(
        'SELECT * FROM asistencias ORDER BY id DESC'
    );
    res.json(result.rows);
});

//////////////////////////////////////////////////
// ADMIN
//////////////////////////////////////////////////

app.get('/admin/users', verifyToken, async (req, res) => {
    const result = await db.query('SELECT id, username FROM usuarios');
    res.json(result.rows);
});

//////////////////////////////////////////////////
// 🚨 ALERTAS
//////////////////////////////////////////////////

app.get('/admin/alerts', verifyToken, async (req, res) => {
    const result = await db.query(`
        SELECT * FROM asistencias
        WHERE horas > 8 OR fuera_zona = true
        ORDER BY id DESC
    `);

    res.json(result.rows);
});

//////////////////////////////////////////////////
// SERVER
//////////////////////////////////////////////////

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor corriendo 🚀");
});