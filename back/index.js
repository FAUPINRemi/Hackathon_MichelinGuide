import express from 'express';
import cors from 'cors';
import restaurants from './routes/restaurants.js';
import hotels from './routes/hotels.js';
import collection from './routes/collection.js';

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));
app.use('/api/restaurants', restaurants);
app.use('/api/hotels', hotels);
app.use('/api/collection', collection);

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
