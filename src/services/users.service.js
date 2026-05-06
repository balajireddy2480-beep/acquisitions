import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

const publicUserFields = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

const createNotFoundError = id => {
  const error = new Error(`User with id ${id} not found`);
  error.statusCode = 404;
  return error;
};

export const getAllUsers = async () => {
  try {
    return await db.select(publicUserFields).from(users);
  } catch (error) {
    logger.error(`Error getting users: ${error}`);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select(publicUserFields)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw createNotFoundError(id);
    }

    return user;
  } catch (error) {
    logger.error(`Error getting user by id ${id}: ${error}`);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    await getUserById(id);

    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning(publicUserFields);

    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user by id ${id}: ${error}`);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    await getUserById(id);

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning(publicUserFields);

    return deletedUser;
  } catch (error) {
    logger.error(`Error deleting user by id ${id}: ${error}`);
    throw error;
  }
};
