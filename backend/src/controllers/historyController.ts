import { Request, Response } from 'express';
import { getDb } from '../db/database';

export const getHistory = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 0;
        const limit = parseInt(req.query.limit as string) || 20;
        const type = req.query.type as string; // 'single' | 'multi' | 'patient' | 'qa' | undefined
        const search = req.query.search as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const db = getDb();

        let query = 'SELECT * FROM query_history WHERE 1=1';
        const params: any[] = [];

        if (type && type !== 'all') {
            query += ' AND query_type = ?';
            params.push(type);
        }

        if (search) {
            query += ' AND query_input LIKE ?';
            params.push(`%${search}%`);
        }

        if (startDate) {
            query += ' AND date(created_at) >= date(?)';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND date(created_at) <= date(?)';
            params.push(endDate);
        }

        // Get total count for pagination
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const totalResult = db.prepare(countQuery).get(...params) as { total: number };
        const total = totalResult.total;

        // Add order and pagination
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, page * limit);

        const records = db.prepare(query).all(...params) as any[];

        // Parse JSON strings back into objects before sending to frontend
        const parsedRecords = records.map(record => ({
            ...record,
            query_input: JSON.parse(record.query_input),
            query_result: JSON.parse(record.query_result)
        }));

        return res.json({
            status: 'success',
            data: {
                records: parsedRecords,
                total,
                page,
                limit
            }
        });

    } catch (error: any) {
        console.error('getHistory error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
