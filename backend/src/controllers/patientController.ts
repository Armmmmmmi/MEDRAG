import { Request, Response } from 'express';
import axios from 'axios';
import { getSetting } from '../db/database';

export const fetchPatientDrugs = async (req: Request, res: Response) => {
    try {
        const { hn, date } = req.body;

        if (!hn || !date) {
            return res.status(400).json({ status: 'error', message: 'Missing hn or date in request body' });
        }

        const queryTemplate = getSetting('patient_query_template')
            || "SELECT drug_name FROM opitemrece WHERE hn = '{HN}' AND vstdate = '{DATE}'";

        const bridgeUrl = getSetting('bridge_server_url') || 'http://localhost:3001';

        // Replace placeholders
        const finalQuery = queryTemplate
            .replace(/{HN}/g, hn)
            .replace(/{DATE}/g, date);

        let drugs: string[] = [];

        try {
            // Assuming bridge server accepts a query POST
            const response = await axios.post(`${bridgeUrl}/query`, { query: finalQuery });

            // Expected response format from bridge server depends on arbitrary legacy code, 
            // but assuming it returns an array of rows or array of strings.
            if (Array.isArray(response.data.data)) {
                // Handle array of objects [{drug_name: 'xxx'}]
                drugs = response.data.data.map((row: any) => {
                    if (typeof row === 'string') return row;
                    return Object.values(row)[0] as string; // take first column
                }).filter(Boolean);
            }
        } catch (e: any) {
            console.error('Bridge server fetch failed:', e.message);
            // For demonstration / fallback if bridge server is not present, return a generic error or empty.
            return res.status(502).json({
                status: 'error',
                message: 'Could not fetch data from bridge server. ' + e.message,
                queryExecuted: finalQuery
            });
        }

        return res.json({
            status: 'success',
            data: {
                hn,
                date,
                drugs
            }
        });

    } catch (error: any) {
        console.error('fetchPatientDrugs error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
