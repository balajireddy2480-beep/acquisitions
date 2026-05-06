import aj from '../config/arcjet.config.js';
import { slidingWindow } from '@arcjet/node';
import logger from '../config/logger.js';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin request limit exceeded (20 per minute)';
        break;
      case 'user':
        limit = 10;
        message = 'User request limit exceeded (10 per minute)';
        break;
      default:
        limit = 5;
        message = 'Guest request limit exceeded (5 per minute)';
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied()) {
      logger.warn('Request blocked', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message,
      });
    }

    next();
  } catch (error) {
    console.error('Security middleware error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong with security middleware',
    });
  }
};

export default securityMiddleware;
