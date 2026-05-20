import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0)
            return res.status(400).json({ error: 'Ya existe una cuenta con ese correo.' });

        const result = await pool.query(
            `INSERT INTO users (name, email, password, member_since)
             VALUES ($1, $2, $3, to_char(NOW(), 'Mon YYYY'))
             RETURNING id, name, email, member_since`,
            [name, email, password]  // hash the password in production!
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
});

// Log in
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT id, name, email, member_since FROM users WHERE email = $1 AND password = $2',
            [email, password]
        );
        if (result.rows.length === 0)
            return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

export default router;