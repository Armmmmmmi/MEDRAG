import { Request, Response } from 'express';
import { getDb } from '../db/database';

export const suggestDrugs = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        if (!query || query.trim() === '') {
            return res.json({ status: 'success', data: [] });
        }

        const searchTerm = `%${query.trim().toLowerCase()}%`;
        const db = getDb();

        // Search for distinct drug names matching the query in both drugA and drugB columns
        const stmt = db.prepare(`
            SELECT DISTINCT name FROM (
                SELECT drugA as name FROM interaction_records WHERE lower(drugA) LIKE ?
                UNION
                SELECT drugB as name FROM interaction_records WHERE lower(drugB) LIKE ?
            ) LIMIT 10
        `);

        const results = stmt.all(searchTerm, searchTerm) as { name: string }[];
        const names = results.map(r => r.name);

        return res.json({
            status: 'success',
            data: names
        });
    } catch (error: any) {
        console.error('suggestDrugs error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
