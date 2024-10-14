import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { config } from '../config';
import { getOrCreateDemoUser } from '../services/demoUserService';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { address, password } = req.body;

  try {
    let user = await User.findOne({ address });

    if (user) {
      res.status(400).json({ msg: 'User already exists' });
      return;
    }

    user = new User({ address });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: '48h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { address, password } = req.body;

  try {
    let user = await User.findOne({ address });

    if (!user) {
      res.status(400).json({ msg: 'Invalid Credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ msg: 'Invalid Credentials' });
      return;
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: '48h' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};


export const tryDemo = async (req: Request, res: Response) => {
  try {
    const { portfolio, performanceAnalytics } = await getOrCreateDemoUser();

    if (!portfolio || !performanceAnalytics) {
      return res.status(500).json({ message: 'Failed to create or retrieve demo user data' });
    }

    const token = jwt.sign({ user: { id: 'demo-user' } }, config.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: { id: 'demo-user', email: 'demo@example.com' },
      portfolio,
      performanceAnalytics,
    });
  } catch (error) {
    console.error('Error in tryDemo:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};