import { Router } from 'express';
import pool from '../db/index.js';

const router = Router();

// Get single event by code
router.get('/:code', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, u.id as organizer_id,
                u.name as organizer_name,
                u.member_since as organizer_since,
                u.avatar_url as organizer_avatar
             FROM events e
             JOIN users u ON e.organizer_id = u.id
             WHERE e.code = $1`,
            [req.params.code]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Evento no encontrado' });

        res.json({ event: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener evento' });
    }
});

// Get all events by a user
router.get('/my/:userId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM events WHERE organizer_id = $1 ORDER BY created_at DESC',
            [req.params.userId]
        );
        res.json({ events: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM events ORDER BY created_at DESC'
        );
        res.json({ events: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener eventos' });
    }
});

// Create event
router.post('/', async (req, res) => {
    const { code, title, description, date, rawDate, time, venue, address, price, priceLabel, totalCapacity, organizerId } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO events (code, title, description, date, raw_date, time, venue, address, price, price_label, total_capacity, organizer_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [code, title, description, date, rawDate, time, venue, address, price, priceLabel, totalCapacity, organizerId]
        );
        res.json({ event: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

// Edit event
router.put('/:code', async (req, res) => {
    const { title, description, date, time, venue, address, price, totalCapacity } = req.body;
    try {
        const result = await pool.query(
            `UPDATE events
             SET title = $1, description = $2, date = $3, time = $4,
                 venue = $5, address = $6, price = $7, total_capacity = $8
             WHERE code = $9
             RETURNING *`,
            [title, description, date, time, venue, address, price, totalCapacity, req.params.code]
        );
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'Evento no encontrado.' });

        res.json({ event: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al editar evento' });
    }
});

// Delete event — cancels tickets first, then deletes the event
router.delete('/:code', async (req, res) => {
    try {
        // Mark all tickets for this event as cancelled before deleting
        await pool.query(
            `UPDATE tickets SET status = 'cancelled' WHERE event_id = $1`,
            [req.params.code]
        );

        await pool.query(
            `DELETE FROM events WHERE code = $1`,
            [req.params.code]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al eliminar evento' });
    }
});

export default router;