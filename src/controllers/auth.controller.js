import logger from '#config/logger.js';
import { signInSchema, signUpSchema } from '#validations/auth.validations.js';
import { formatValidationError } from '#utils/format.js';
import { authenticateUser, createUser } from '#services/auth.service.js';
import { jwtService } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const data = validationResult.data;

    const user = await createUser(data);

    return res.status(201).json({
      message: 'User registered',
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    cookies.set(res, 'token', token);

    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({
      message: 'User registered ',
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
  next(error);
};

export const signIn = async (req, res) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const user = await authenticateUser(email, password);

    const token = jwtService.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    cookies.set(res, 'token', token);

    logger.info(`User logged in successfully: ${user.email}`);
    return res.status(200).json({
      message: 'User logged in',
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const signOut = async (req, res) => {
  try {
    cookies.clear(res, 'token');

    logger.info('User logged out successfully');
    return res.status(200).json({
      message: 'User logged out',
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};
