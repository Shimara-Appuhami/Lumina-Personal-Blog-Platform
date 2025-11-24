import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import generateToken from '../utils/generateToken.js';

export const registerUser = async ({ username, email, password, avatar }) => {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    throw new ApiError(409, 'Username or email already in use');
  }

  const user = await User.create({ username, email, password, avatar });
  const token = generateToken(user.id);

  return { user: user.toJSON(), token };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = generateToken(user.id);
  return { user: user.toJSON(), token };
};
