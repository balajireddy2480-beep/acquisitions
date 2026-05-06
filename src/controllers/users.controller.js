import logger from '#config/logger.js';
import {
  deleteUser as deleteUserService,
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
} from '#services/users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import { cookies } from '#utils/cookies.js';
import { jwtService } from '#utils/jwt.js';

const getAuthenticatedUser = req => {
  if (req.user) {
    return req.user;
  }

  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;
  const token = cookies.get(req, 'token') || bearerToken;

  if (!token) {
    return null;
  }

  try {
    return jwtService.verify(token);
  } catch {
    return null;
  }
};

const isAdmin = user => user?.role === 'admin';

const isSelf = (user, id) => Number(user?.id) === id;

const validateUserId = req => {
  const validationResult = userIdSchema.safeParse(req.params);

  if (!validationResult.success) {
    return {
      error: {
        statusCode: 400,
        message: 'validation failed',
        details: formatValidationError(validationResult.error),
      },
    };
  }

  return { id: validationResult.data.id };
};

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting all users...');

    const allUsers = await getAllUsers();
    res.json({
      message: 'Sucessfully retrieved all users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id, error } = validateUserId(req);

    if (error) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
      });
    }

    logger.info(`Getting user by id: ${id}`);

    const user = await getUserByIdService(id);

    return res.status(200).json({
      message: 'Successfully retrieved user',
      user,
    });
  } catch (error) {
    logger.error(error);

    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id, error: idError } = validateUserId(req);

    if (idError) {
      return res.status(idError.statusCode).json({
        error: idError.message,
        details: idError.details,
      });
    }

    const validationResult = updateUserSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const authUser = getAuthenticatedUser(req);

    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const updates = validationResult.data;

    if (!isSelf(authUser, id) && !isAdmin(authUser)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Users can update only their own information',
      });
    }

    if (updates.role && !isAdmin(authUser)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admin users can update roles',
      });
    }

    logger.info(`Updating user by id: ${id}`);

    const user = await updateUserService(id, updates);

    return res.status(200).json({
      message: 'Successfully updated user',
      user,
    });
  } catch (error) {
    logger.error(error);

    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id, error } = validateUserId(req);

    if (error) {
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.details,
      });
    }

    const authUser = getAuthenticatedUser(req);

    if (!authUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!isSelf(authUser, id) && !isAdmin(authUser)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Users can delete only their own account',
      });
    }

    logger.info(`Deleting user by id: ${id}`);

    const user = await deleteUserService(id);

    return res.status(200).json({
      message: 'Successfully deleted user',
      user,
    });
  } catch (error) {
    logger.error(error);

    return res.status(error.statusCode || 500).json({
      error: error.message || 'Internal Server Error',
    });
  }
};
