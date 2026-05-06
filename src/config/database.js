import 'dotenv/config';

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const { DATABASE_URL, NEON_LOCAL, NEON_LOCAL_FETCH_ENDPOINT } = process.env;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

if (NEON_LOCAL === 'true') {
  neonConfig.fetchEndpoint =
    NEON_LOCAL_FETCH_ENDPOINT || 'http://localhost:5432/sql';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(DATABASE_URL);

const db = drizzle(sql);

export { db, sql };
