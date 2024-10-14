import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UserRequest } from '../types';

interface DecodedToken {
  user: {
    id: string;
  };
  iat: number;
  exp: number;
}

export const authMiddleware = (req: UserRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  console.log('Received token:', token);

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as DecodedToken;
    console.log('Decoded token:', decoded);

    if (!decoded.user || !decoded.user.id) {
      console.log('Invalid token structure');
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    req.user = { id: decoded.user.id };
    console.log('Set user:', req.user);

    next();
  } catch (err) {
    console.error('Error decoding token:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};