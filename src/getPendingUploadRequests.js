const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../config/.miner_config");
const miner_config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const queryTypes = require("../util/queryTypes.js");
const queryDB = queryTypes.queryDB();
const miners = miner_config.miners;
const blockchains = miner_config.blockchains;
const rollback_time_min = miner_config.rollback_time_min;

module.exports = {
  getPendingUploadRequests: async function getPendingUploadRequests() {
    try {
      console.log(`Checking for assets to publish...`);
      let query;
      let params;
      let pending_requests = [];
      for (const blockchain of blockchains) {
        if (!blockchain.enabled) {
          continue;
        }
        query =
          "select txn_id,progress,miner,blockchain,receiver,data_id,epochs,updated_at,created_at,paranet_ual FROM txn_header WHERE progress = ? AND blockchain = ? AND request = ? ORDER BY created_at ASC LIMIT 1";
        params = ["PENDING", blockchain.name, "create"];
        let request = await queryDB
          .getData(query, params)
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });

        // if (request.length > 0) {
        //   query =
        //     "select progress FROM txn_header WHERE receiver = ? AND blockchain = ? and miner IS NOT NULL ORDER BY updated_at ASC LIMIT 1";
        //   params = [request[0].receiver, blockchain.name];
        //   let receiver = await queryDB
        //     .getData(query, params)
        //     .then((results) => {
        //       return results;
        //     })
        //     .catch((error) => {
        //       console.error("Error retrieving data:", error);
        //     });

        //   if (receiver.length > 0 && receiver[0].progress !== "COMPLETE") {
        //     console.log(
        //       `Processing asset creation found for ${request[0].receiver}. Skipping...`
        //     );
        //     query = `UPDATE txn_header SET progress = ? WHERE txn_id = ?`;
        //     params = [
        //       "PENDING",
        //       request[0].txn_id,
        //     ];
        //     await queryDB
        //       .getData(query, params)
        //       .then((results) => {
        //         return results;
        //       })
        //       .catch((error) => {
        //         console.error("Error retrieving data:", error);
        //       });

        //     continue;
        //   }
        // }

        let available_miners = [];
        for (let miner of miners) {
          query = `select txn_id,progress,miner,blockchain,data_id,epochs,updated_at,created_at,ual,paranet_ual FROM txn_header WHERE progress = ? AND miner = ? AND blockchain = ? order by updated_at DESC LIMIT 1`;
          params = ["PROCESSING", miner.public_key, blockchain.name];
          let last_processed = await queryDB
            .getData(query, params)
            .then((results) => {
              return results;
            })
            .catch((error) => {
              console.error("Error retrieving data:", error);
            });

          if (Number(last_processed.length) === 0) {
            available_miners.push(miner);
            continue;
          }

          let updatedAtTimestamp = last_processed[0].updated_at;
          let currentTimestamp = new Date();
          let timeDifference = currentTimestamp - updatedAtTimestamp;

          //create nhung up and never happened
          if (
            last_processed[0].progress === "PROCESSING" &&
            timeDifference >= rollback_time_min * 60000
          ) {
            console.log(
              `${miner.name} wallet ${miner.public_key}: Publishing for over ${rollback_time_min} minutes. Rolling back to pending...`
            );
            query = `UPDATE txn_header SET progress = ?, miner = ? WHERE miner = ? AND progress = ? and blockchain = ?`;
            params = [
              "PENDING",
              null,
              miner.public_key,
              "PROCESSING",
              blockchain.name,
            ];
            await queryDB
              .getData(query, params)
              .then((results) => {
                return results;
              })
              .catch((error) => {
                console.error("Error retrieving data:", error);
              });

            await available_miners.push(miner);
            continue;
          }
        }

        console.log(
          `${blockchain.name} has ${available_miners.length} available miners.`
        );

        if (Number(available_miners.length) === 0) {
          continue;
        }

        if (Number(request.length) === 0) {
          console.log(`${blockchain.name} has no pending assets to publish.`);
          continue;
        }

        request[0].miner = available_miners[0].public_key;
        pending_requests.push(request[0]);

        query = `UPDATE txn_header SET progress = ?, miner = ? WHERE txn_id = ?`;
        params = [
          "PROCESSING",
          available_miners[0].public_key,
          request[0].txn_id,
        ];
        await queryDB
          .getData(query, params)
          .then((results) => {
            return results;
          })
          .catch((error) => {
            console.error("Error retrieving data:", error);
          });
      }

      return pending_requests;
    } catch (error) {
      throw new Error("Error fetching pending assets: " + error.message);
    }
  },
};
