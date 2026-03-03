import { Request, Response } from 'express';
import { getDb, getSetting, setSetting } from '../db/database';
import { processCsvImport, reindexAll } from '../services/importService';
import { ensureCollection } from '../services/qdrantService';
import { getEmbedding } from '../services/embeddingService';
import fs from 'fs';

export const importCsv = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        const skipEmbedding = req.body.skipEmbedding === 'true';

        if (!skipEmbedding) {
            // Pre-flight check: Test if embedding service is online
            try {
                await getEmbedding('test');
                // Ensure collection exists and matches dimension before starting
                await ensureCollection();
            } catch (embedError: any) {
                console.warn('Embedding pre-flight check failed:', embedError.message);
                // Clean up the uploaded file since we're returning early
                try {
                    fs.unlinkSync(req.file.path);
                } catch (e) { /* ignore */ }

                return res.json({
                    status: 'warning',
                    requiresConfirmation: true,
                    message: 'Embedding service is offline or unreachable. Do you want to save the data to SQLite only (skip Qdrant)?'
                });
            }
        }

        // Process async to avoid blocking response for huge files
        // But for simplicity/demo, we block and return count
        const count = await processCsvImport(req.file.path, skipEmbedding);

        return res.json({
            status: 'success',
            message: `Successfully imported ${count} records`
        });
    } catch (error: any) {
        console.error('importCsv error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const exportData = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const records = db.prepare('SELECT * FROM interaction_records').all();

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=medrag_export.json');
        return res.send(JSON.stringify(records, null, 2));
    } catch (error: any) {
        console.error('exportData error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const runReindex = async (req: Request, res: Response) => {
    try {
        // Process async
        reindexAll().catch(console.error);

        return res.json({
            status: 'success',
            message: 'Re-indexing started in background'
        });
    } catch (error: any) {
        console.error('runReindex error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getRecords = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const db = getDb();
        const records = db.prepare('SELECT * FROM interaction_records ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
        const total = (db.prepare('SELECT COUNT(*) as count FROM interaction_records').get() as { count: number }).count;

        return res.json({
            status: 'success',
            data: {
                records,
                total,
                limit,
                offset
            }
        });
    } catch (error: any) {
        console.error('getRecords error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const settings = db.prepare('SELECT * FROM app_settings').all() as { key: string, value: string }[];

        const settingsMap: Record<string, string> = {};
        for (const s of settings) {
            settingsMap[s.key] = s.value;
        }

        return res.json({
            status: 'success',
            data: settingsMap
        });
    } catch (error: any) {
        console.error('getSettings error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const settings = req.body;

        for (const [key, value] of Object.entries(settings)) {
            if (typeof value === 'string') {
                setSetting(key, value);
            }
        }

        return res.json({
            status: 'success',
            message: 'Settings updated'
        });
    } catch (error: any) {
        console.error('updateSettings error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
