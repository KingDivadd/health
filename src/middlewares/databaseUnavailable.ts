import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const handleDatabaseError = async (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof Error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ error: 'An internal server error occurred.' });
    }
    console.log('good to go')
    next();
};

export default handleDatabaseError