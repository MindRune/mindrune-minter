const pool = require("../database/mindrune_db");
module.exports = executeQuery = async (query, params) => {
  return new Promise(async (resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) reject(err);

      connection.query(query, params, (error, results) => {
        connection.release(); // Release the connection back to the pool
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  });
};
