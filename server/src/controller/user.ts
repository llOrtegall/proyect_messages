import { JWT_SECRET } from '../schemas/envSchema';
import { Request, Response } from 'express';
import { Users } from '../models/users';
import jwt from 'jsonwebtoken';
import bcript from 'bcryptjs';
import { validateSchema } from '../../schemas/services';
import { verifyToken } from '../services/tokenVerifyToken';

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

export const loginUser = async (req: Request, res: Response) => {
  const result = validateSchema(req.body)

  try {
    await Users.sync();

    const user = await Users.findOne({
      where: {
        username: result.username
      }
    })

    if (user === null) {
      res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = bcript.compareSync(result.password, user?.dataValues.password!);

    if (!isPasswordValid) {
      res.status(400).json({ message: 'Invalid password' });
    }

    jwt.sign({ id: user?.dataValues.id, username: user?.dataValues.username }, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) {
        res.status(500).json({ message: 'Error generating token' });
      }
      // Send the token as a response
      res.cookie('token', token).status(200).json({ id: user?.dataValues.id, username: user?.dataValues.username });
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Handles the retrieval of the user's profile based on the JWT token from cookies.
 * If the token is missing or invalid, it returns a 401 Unauthorized response.
 * If the user is not found, it returns a 404 User not found response.
 * On successful retrieval, it responds with the user's ID and username.
 * In case of any internal server errors, it returns a 500 Internal server error response.
 */
export const userProfile = async (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = await verifyToken(token);


    if (!decoded) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

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
    if(error instanceof Error){
      if(error.message === 'TOKEN_EXPIRED'){
        res.clearCookie('token').status(401).json({ message: 'Unauthorized' });
        return;
      }
    }
    res.status(500).json({ message: 'Internal server error' });
  }

}