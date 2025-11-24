import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const generateToken = (userId) => {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not defined.');
  }

  return jwt.sign({}, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    subject: userId
  });
};

export default generateToken;
