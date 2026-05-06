import logger from '#config/logger.js';
import { getAllUsers } from '#services/users.service.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting all users...');

    const allUsers = await getAllUsers();

    if (!allUsers || allUsers.length === 0) {
      return res.status(404).json({
        error: 'No users found',
      });
    }

    return res.status(200).json({
      message: 'Successfully retrieved all users',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
