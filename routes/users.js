import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

function detectBrand(cardNumber) {
    if (/^4/.test(cardNumber)) return 'visa';
    if (/^5[1-5]/.test(cardNumber)) return 'mastercard';
    if (/^3[47]/.test(cardNumber)) return 'amex';
    return 'card';
}

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

// GET cards for a user
router.get('/:userId/cards', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, cardholder_name, brand, last4, exp_month, exp_year, is_default FROM saved_cards WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [req.params.userId]
        );
        res.json({ cards: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'No se pudieron cargar las tarjetas' });
    }
});

// POST add a card
router.post('/:userId/cards', async (req, res) => {
    const { cardholderName, cardNumber, expMonth, expYear } = req.body;

    if (!cardholderName || !cardNumber || !expMonth || !expYear) {
        return res.status(400).json({ error: 'Faltan datos de la tarjeta' });
    }

    const last4 = cardNumber.replace(/\s/g, '').slice(-4);
    const brand = detectBrand(cardNumber.replace(/\s/g, ''));

    try {
        const { rows } = await pool.query(
            `INSERT INTO saved_cards (user_id, cardholder_name, brand, last4, exp_month, exp_year)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, cardholder_name, brand, last4, exp_month, exp_year, is_default`,
            [req.params.userId, cardholderName, brand, last4, expMonth, expYear]
        );
        res.status(201).json({ card: rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'No se pudo guardar la tarjeta' });
    }
});

// DELETE a card
router.delete('/:userId/cards/:cardId', async (req, res) => {
    try {
        await pool.query('DELETE FROM saved_cards WHERE id = $1', [req.params.cardId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'No se pudo eliminar la tarjeta' });
    }
});

export default router;