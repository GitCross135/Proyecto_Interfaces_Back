import express from 'express';
import cors from 'cors';
import ticketRoutes from './routes/tickets.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});