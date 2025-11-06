import { Router, type Router as RouterType } from 'express';
import { requireAuth } from './auth';

export const apiRouter: RouterType = Router();

apiRouter.get('/me', requireAuth, async (req: any, res) => {
    return res.json({ uid: req.uid });
});