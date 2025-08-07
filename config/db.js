


// db.js
import mysql from 'mysql2/promise';
 
let pool;
 
// Create pool lazily so we can recreate it on connection loss
const createPool = () => {
  pool = mysql.createPool({
    host: '89.116.21.92',
    user: 'root',
    password: 'creativeThoughts@2025#',
    database: 'creative_ai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,   // 10 seconds
    idleTimeout: 60000       // 1 minute
  });
};
 
// Initialize pool once
createPool();
 

export const query = async (sql, params = [], retries = 2, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log("sql", sql);
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      // Retry on lost or fatal connections
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
        console.error("Connection lost. Recreating pool...");
        createPool();
      }
 
      // Retry if not the last attempt
      if (attempt < retries) {
        console.warn(`Query failed (attempt ${attempt}). Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        console.error("Final attempt failed. Throwing error.");
        throw err;
      }
    }
  }
};
 
// Export query method as default
export default { query };
 
 