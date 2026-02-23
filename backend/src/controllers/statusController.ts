import { Request, Response } from 'express';
import { getDb } from '../db/database';
import { getQdrantClient } from '../services/qdrantService';
import axios from 'axios';
import { getSetting } from '../db/database';

export const getStatus = async (req: Request, res: Response) => {
    try {
        // Check SQLite
        const db = getDb();
        const dbCount = db.prepare('SELECT COUNT(*) as count FROM interaction_records').get() as { count: number };

        // Check Qdrant
        let qdrantStatus = 'unknown';
        try {
            const qClient = getQdrantClient();
            const col = await qClient.getCollection(getSetting('qdrant_collection') || 'ddi_vectors');
            qdrantStatus = col.status;
        } catch (e) {
            qdrantStatus = 'error or missing collection';
        }

        // Check Ollama Embedding
        let embStatus = 'unknown';
        try {
            await axios.get(`${getSetting('embedding_url') || 'http://localhost:11434'}/api/tags`);
            embStatus = 'ok';
        } catch (e) {
            embStatus = 'error';
        }

        // Check Ollama Generation
        let genStatus = 'unknown';
        try {
            await axios.get(`${getSetting('generation_url') || 'http://localhost:11434'}/api/tags`);
            genStatus = 'ok';
        } catch (e) {
            genStatus = 'error';
        }

        res.json({
            status: 'ok',
            services: {
                database: { status: 'ok', recordsCount: dbCount.count },
                qdrant: { status: qdrantStatus },
                embedding: { status: embStatus, model: getSetting('embedding_model') },
                generation: { status: genStatus, model: getSetting('generation_model') }
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
