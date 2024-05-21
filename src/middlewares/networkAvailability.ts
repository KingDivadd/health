import { Request, Response, NextFunction } from 'express';
import dns from 'dns';

const checknetworkAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
        dns.resolve('www.google.com', (err) => {
            if (err) {
                return res.status(503).json({ error: 'Network unavailable, check network connection and try again' });
            } else {
                next();
            }
        });
    } catch (error) {
        // Error occurred while checking network status
        console.error('Error checking network availability:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export default checknetworkAvailability;
