import { Router } from 'express';
import pool from '../db/index.js';
import QRCode from 'qrcode';

const router = Router();

// Get all available resales for a specific event
router.get('/event/:eventId', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                r.id,
                r.price,
                r.created_at,
                r.ticket_id,
                u.name      AS seller_name,
                u.id        AS seller_id,
                u.avatar_url AS seller_avatar_url
             FROM resales r
             JOIN users u ON r.seller_id = u.id
             WHERE r.event_id = $1 AND r.status = 'available'
             ORDER BY r.price ASC`,
            [req.params.eventId]
        );
        res.json({ resales: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener reventas' });
    }
});

// List a ticket for resale
router.post('/', async (req, res) => {
    const { ticketId, sellerId, eventId, price } = req.body;
    try {
        // Make sure this ticket belongs to the seller
        const ownership = await pool.query(
            'SELECT id FROM tickets WHERE id = $1 AND user_id = $2',
            [ticketId, sellerId]
        );
        if (ownership.rows.length === 0)
            return res.status(403).json({ error: 'Este ticket no te pertenece.' });

        // Make sure it's not already listed
        const existing = await pool.query(
            'SELECT id FROM resales WHERE ticket_id = $1 AND status = $2',
            [ticketId, 'available']
        );
        if (existing.rows.length > 0)
            return res.status(400).json({ error: 'Este ticket ya está en reventa.' });

        const result = await pool.query(
            `INSERT INTO resales (ticket_id, seller_id, event_id, price)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [ticketId, sellerId, eventId, price]
        );
        res.json({ resale: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al publicar reventa' });
    }
});

// Purchase a resale ticket
router.post('/:resaleId/purchase', async (req, res) => {
    const { buyerId } = req.body;
    try {
        // Get the resale
        const resaleResult = await pool.query(
            'SELECT * FROM resales WHERE id = $1 AND status = $2',
            [req.params.resaleId, 'available']
        );
        if (resaleResult.rows.length === 0)
            return res.status(404).json({ error: 'Reventa no disponible.' });

        const resale = resaleResult.rows[0];

        // Transfer ticket ownership to buyer
        await pool.query(
            'DELETE FROM tickets WHERE id = $1',
            [resale.ticket_id]  
        );

        const newTicketResult = await pool.query(
            'INSERT INTO tickets (user_id, event_id) VALUES ($1, $2) RETURNING *',
            [buyerId, resale.event_id]
        );
        const newTicket = newTicketResult.rows[0];

        const qrCodeDataUrl = await QRCode.toDataURL(newTicket.token.toString(), { width: 300, margin: 2 });
        
        await pool.query(
            `UPDATE tickets SET qr_code_data_url = $1 WHERE id = $2`,
            [qrCodeDataUrl, newTicket.id]
        );

        // Mark resale as sold
        await pool.query(
            'UPDATE resales SET status = $1 WHERE id = $2',
            ['sold', resale.id]
        );

        // Return the updated ticket with QR code
        res.json({ ticket: { ...newTicket, qrCodeDataUrl } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al comprar reventa' });
    }
});

export default router;