import express from 'express';
import cors from 'cors';
import ticketRoutes from './routes/tickets.js';
import userRoutes from './routes/users.js';
import eventRoutes from './routes/events.js';
import resaleRoutes from './routes/resales.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resales', resaleRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});