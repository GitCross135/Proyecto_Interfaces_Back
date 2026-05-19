import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

const router = Router();

// In-memory store for now — swap for a real DB later
const tickets = [];

router.post('/purchase', async (req, res) => {
    const { userId, eventId } = req.body;
    const created = [];

    const token = uuidv4();
    const qrCodeDataUrl = await QRCode.toDataURL(token, { width: 300, margin: 2 });
    const ticket = { id: uuidv4(), userId, eventId, token, status: 'active', usedAt: null, qrCodeDataUrl };
    tickets.push(ticket);
    created.push(ticket);

    res.json({ tickets: created });
});

router.post('/validate', async (req, res) => {
    const { token, eventId } = req.body;
    const isManualCode = token.length === 8;

    const ticket = isManualCode
        ? tickets.find((t) => t.token.slice(0, 8).toUpperCase() === token.toUpperCase())
        : tickets.find((t) => t.token === token);

    if (!ticket) return res.json({ valid: false, reason: 'Ticket no encontrado' });
    if (ticket.eventId !== eventId) return res.json({ valid: false, reason: 'Ticket no corresponde a este evento' });
    if (ticket.status === 'used') return res.json({ valid: false, reason: `Ya se usó el ${ticket.usedAt}` });
    if (ticket.status === 'cancelled') return res.json({ valid: false, reason: 'Ticket cancelado' });

    ticket.status = 'used';
    ticket.usedAt = new Date();

    res.json({ valid: true, ticket: { eventId: ticket.eventId, userId: ticket.userId } });
});

export default router;