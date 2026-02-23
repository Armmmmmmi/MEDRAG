import express from 'express';
import cors from 'cors';
import { getDb } from './db/database';
import { ensureCollection } from './services/qdrantService';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

async function start() {
    try {
        // Initialize DB
        getDb();
        console.log('SQLite database initialized.');

        // Ensure Qdrant collection exists
        await ensureCollection();

        const server = app.listen(PORT, () => {
            console.log(`MEDRAGV2 Backend running on http://localhost:${PORT}`);
        });
        server.setTimeout(1800000); // 30 mins timeout for large CSV imports
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();

// Cleanup on exit
process.on('SIGINT', () => {
    const db = getDb();
    if (db) db.close();
    process.exit();
});
