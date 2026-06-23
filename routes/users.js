import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Sign up
router.post('/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0)
            return res.status(400).json({ error: 'Ya existe una cuenta con ese correo.' });

        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, name, email, password, member_since, balance)
             VALUES ($1, $2, $3, $4, $5, to_char(NOW(), 'Mon YYYY'), 0)
             RETURNING id, first_name, last_name, name, email, balance, member_since, avatar_url`,
            [firstName, lastName, `${firstName} ${lastName}`, email, password]
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
            `SELECT id, first_name, last_name, name, email, balance, member_since, avatar_url
             FROM users WHERE email = $1 AND password = $2`,
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

// Edit profile
router.put('/:id', async (req, res) => {
    const { firstName, lastName, email } = req.body;
    try {
        // Check email isn't taken by another user
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1 AND id != $2',
            [email, req.params.id]
        );
        if (existing.rows.length > 0)
            return res.status(400).json({ error: 'Ese correo ya está en uso.' });

        const result = await pool.query(
            `UPDATE users
             SET first_name = $1, last_name = $2, name = $3, email = $4
             WHERE id = $5
             RETURNING id, first_name, last_name, name, email, member_since, avatar_url`,
            [firstName, lastName, `${firstName} ${lastName}`, email, req.params.id]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

router.put('/:id/balance', async (req, res) => {
    const { newBalance } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users
             SET balance = $1
             WHERE id = $2
             RETURNING id, first_name, last_name, name, email, balance, member_since, avatar_url`,
            [newBalance, req.params.id]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al actualizar QuorumCoins' });
    }
});

export default router;