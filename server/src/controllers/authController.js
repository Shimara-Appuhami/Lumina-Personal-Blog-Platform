import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';
import { registerUser, loginUser } from '../services/authService.js';

export const register = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation error', errors.array());
  }

  const { username, email, password, avatar } = req.body;
  const { user, token } = await registerUser({ username, email, password, avatar });

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
};

export const login = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation error', errors.array());
  }

  const { email, password } = req.body;
  const { user, token } = await loginUser({ email, password });

  res.json({
    success: true,
    data: {
      user,
      token
    }
  });
};
