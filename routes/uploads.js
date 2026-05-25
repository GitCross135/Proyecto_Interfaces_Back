import { Router } from 'express';
import { uploadEvent, uploadAvatar } from '../config/cloudinary.js';
import pool from '../db/index.js';

const router = Router();

// Upload event image
router.post('/event/:code', uploadEvent.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file.path;
        await pool.query(
            'UPDATE events SET image_url = $1 WHERE code = $2',
            [imageUrl, req.params.code]
        );
        res.json({ imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al subir imagen del evento' });
    }
});

// Upload avatar
router.post('/avatar/:userId', uploadAvatar.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file.path;
        await pool.query(
            'UPDATE users SET avatar_url = $1 WHERE id = $2',
            [imageUrl, req.params.userId]
        );
        res.json({ imageUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al subir avatar' });
    }
});

export default router;