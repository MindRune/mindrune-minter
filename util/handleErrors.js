const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../config/.miner_config.json");
const miner_config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const queryTypes = require("./queryTypes");
const queryDB = queryTypes.queryDB();
const miners = miner_config.miners;
const retry_time_min = miner_config.retry_time_min;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  handleError: async function handleError(message) {
    try {
      let query;
      let params;

        if (message.request === "TRANSFER") {
            query = `UPDATE txn_header SET progress = ? WHERE miner = ? AND progress = ? AND blockchain = ?`;
            params = [
                "TRANSFER-FAILED",
                message.public_key,
                "CREATED",
                message.blockchain,
            ];
            await queryDB
                .getData(query, params)
                .then((results) => {
                    //console.log('Query results:', results);
                    return results;
                    // Use the results in your variable or perform further operations
                })
                .catch((error) => {
                    console.error("Error retrieving data:", error);
                });
            return;
        }

      if (
        message.error === "Safe mode validation error." ||
        message.error ===
          "File format is corrupted, no n-quads are extracted." ||
        message.error ===
          "Dereferencing a URL did not result in a JSON object." ||
        message.error ===
          `Invalid JSON-LD syntax; "@type" value must a string, an array of strings, an empty object, or a default object.` ||
        message.error.includes("undefined")
      ) {
        console.log(
          `Wallet ${message.public_key}: Create failed. ${message.error} Abandoning...`
        );
        query = `UPDATE txn_header SET progress = ? WHERE miner = ? AND progress = ? AND blockchain = ?`;
        params = [
          "CREATE-ABANDONED",
          message.public_key,
          "PROCESSING",
          message.blockchain,
        ];
        await queryDB
          .getData(query, params)
          .then((results) => {
            //console.log('Query results:', results);
            return results;
            // Use the results in your variable or perform further operations
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
        return;
      }

      //if (message.request === "CREATE-PARANET") {
      //  console.log(
      //    `Wallet ${message.public_key}: Paranet create failed. ${message.error} Abandoning...`
      //  );
      //  query = `UPDATE txn_header SET progress = ? WHERE miner = ? AND progress = ? AND blockchain = ?`;
      //  params = [
      //    "CREATED",
      //    message.public_key,
      //    "PROCESSING",
      //    message.blockchain,
      //  ];
      //  await queryDB
      //    .getData(query, params)
      //    .then((results) => {
      //      //console.log('Query results:', results);
      //      return results;
      //      // Use the results in your variable or perform further operations
      //    })
      //    .catch((error) => {
      //      console.error("Error retrieving data:", error);
      //    });
      //  return;
      //}

      console.log(
        `Wallet ${message.public_key}: Create failed. ${message.error}. Reverting to pending in ${retry_time_min} minute...`
      );
      await sleep(retry_time_min * 60000);

      query = `UPDATE txn_header SET progress = ?, miner = ? WHERE miner = ? AND progress = ? AND blockchain = ?`;
      params = [
        "PENDING",
        null,
        message.public_key,
        "PROCESSING",
        message.blockchain,
      ];
      await queryDB
        .getData(query, params)
        .then((results) => {
          //console.log('Query results:', results);
          return results;
          // Use the results in your variable or perform further operations
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
      return;
    } catch (error) {
      console.log(error);
    }
  },
};
