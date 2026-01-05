import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    telegramId: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId: string;
      telegramId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, telegramId: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      const decoded = jwt.verify(token, config.jwtSecret) as {
        userId: string;
        telegramId: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, telegramId: true },
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Token invalid, but continue without user
    next();
  }
};
