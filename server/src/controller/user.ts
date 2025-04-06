import { JWT_SECRET } from '../schemas/envSchema';
import { Request, Response } from 'express';
import { Users } from '../models/users';
import jwt from 'jsonwebtoken';
import bcript from 'bcryptjs';

export const registerUser = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    await Users.sync();

    const hashedPassword = await bcript.hash(password, 10);

    const result = await Users.create({ username, password: hashedPassword })

    if (!result) {
      res.status(400).json({ message: 'User registration failed' });
    }
    // Generate a JWT token
    jwt.sign({ id: result.id }, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        res.status(500).json({ message: 'Error generating token' });
      }
      // Send the token as a response
      res.cookie('token', token).status(201).json({ id: result.id, username: result.username });
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const userProfile = async (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ message: 'Forbidden' });
    }

    try {
      const user = await Users.findOne({
        where: {
          id: decoded.id
        }
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json({ id: user.id, username: user.username });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  })
}