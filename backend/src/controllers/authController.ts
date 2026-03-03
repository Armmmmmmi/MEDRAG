import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/database';

const JWT_SECRET = process.env.JWT_SECRET || 'medrag_super_secret_key_1234';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ status: 'error', message: 'Missing username or password' });
        }

        const db = getDb();
        const user = db.prepare('SELECT id, password_hash FROM admin_users WHERE username = ?').get(username) as { id: number, password_hash: string } | undefined;

        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ status: 'error', message: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: '12h' });

        return res.json({
            status: 'success',
            data: { token, username }
        });
    } catch (error: any) {
        console.error('login error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
    // If request reaches here, the auth middleware already validated it
    return res.json({
        status: 'success',
        data: { user: (req as any).user }
    });
};
