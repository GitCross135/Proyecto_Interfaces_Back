import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import pool from '../db';

const router = Router();

// In-memory store for now — swap for a real DB later
const tickets = [];

router.post('/purchase', async (req, res) => {
    const { userId, eventId } = req.body;
    const created = [];

    try {
        const result = await pool.query(
            `INSERT INTO tickets (user_id, event_id)
            VALUES ($1, $2)
            RETURNING *`,
            [userId, eventId]
        );

        const ticket = result.rows[0];
        const qrCodeDataUrl = await QRCode.toDataURL(ticket.token, { width: 300, margin: 2 });
        created.push({ ...ticket, qrCodeDataUrl });

        await pool.query(
            `UPDATE events SET sold_tickets = sold_tickets + 1 WHERE code = $1`,
            [eventId]
        );

        res.json({ tickets: created });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al comprar ticket' });
    }

});

router.post('/validate', async (req, res) => {
    const { token, eventId } = req.body;

    try {
        const isManualCode = token.length === 8;
        const query = isManualCode
            ? `SELECT * FROM tickets WHERE LEFT(token::text, 8) = $1`
            : `SELECT * FROM tickets WHERE token = $1`;
        
        const result = await pool.query(query, [token.toLowerCase()]);
        const ticket = result.rows[0];

        if (!ticket) return res.json({ valid: false, reason: 'Ticket no encontrado' });
        if (ticket.event_id !== eventId) return res.json({ valid: false, reason: 'Ticket no corresponde a este evento' });
        if (ticket.status === 'used') return res.json({ valid: false, reason: `Ya se usó el ${ticket.used_at}` });
        if (ticket.status === 'cancelled') return res.json({ valid: false, reason: 'Ticket cancelado' });

        await pool.query(
            `UPDATE tickets SET status = 'used', used_at = NOW() WHERE id = $1`,
            [ticket.id]
        );

        res.json({ valid: true, ticket: { eventId: ticket.event_id, userId: ticket.user_id } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al validar ticket' });
    }
});

export default router;