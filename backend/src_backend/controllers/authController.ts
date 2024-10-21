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

export const loginDemo = async (req: Request, res: Response): Promise<void> => {
  try {
    const demoAddress = '0xDEMO1234567890DeFiDashboardDemo1234567890';
    const demoPassword = 'demopassword123';

    let user = await User.findOne({ address: demoAddress });

    if (!user) {
      // Create the demo user if it doesn't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(demoPassword, salt);
      user = new User({ address: demoAddress, password: hashedPassword });
      await user.save();
    }

    const isMatch = await bcrypt.compare(demoPassword, user.password);

    if (!isMatch) {
      res.status(400).json({ msg: 'Invalid Demo Credentials' });
      return;
    }

    const { portfolio, performanceAnalytics, transactions } = await getOrCreateDemoUser(user.id);

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
        res.json({
          token,
          user: { id: user.id, email: user.address },
          portfolio,
          performanceAnalytics,
          transactions,
        });
      }
    );
  } catch (error) {
    console.error('Error in loginDemo:', error);
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};