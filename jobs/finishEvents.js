import cron from 'node-cron';
import pool from '../db/index.js';

export function startFinishEventsJob() {
    // Runs every hour
    cron.schedule('0 * * * *', async () => {
        try {
            const result = await pool.query(
                `UPDATE events
                 SET status = 'finished'
                 WHERE status = 'active'
                   AND (date || ' ' || time)::timestamp < NOW() - INTERVAL '24 hours'
                 RETURNING code, title`
            );
            if (result.rows.length > 0) {
                console.log(`Marked ${result.rows.length} event(s) as finished:`,
                    result.rows.map(e => e.title).join(', '));
            }
        } catch (err) {
            console.error('Error running finishEvents job:', err);
        }
    });

    console.log('finishEvents cron job started');
}