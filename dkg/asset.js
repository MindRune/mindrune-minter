const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../config/.miner_config.json");
const miner_config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const DKGClient = require("dkg.js");
const testnet_host = miner_config.testnet_host;
const mainnet_host = miner_config.mainnet_host;
const testnet_port = miner_config.testnet_port;
const mainnet_port = miner_config.mainnet_port;
const useSSL = miner_config.useSSL;
const handleErrors = require("../util/handleErrors.js");
const environment = miner_config.environment;

const testnet_node_options = {
  endpoint: testnet_host,
  port: testnet_port,
  useSSL: useSSL,
  maxNumberOfRetries: 100,
};

const mainnet_node_options = {
  endpoint: mainnet_host,
  port: mainnet_port,
  useSSL: useSSL,
  maxNumberOfRetries: 100,
};

const testnet_dkg = new DKGClient(testnet_node_options);
const mainnet_dkg = new DKGClient(mainnet_node_options);

function randomWords(words) {
  const randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

module.exports = {
  create: async function create(
    content,
    epochs,
    blockchain,
    public_key,
    private_key,
    paranet_ual,
    txn_id
  ) {
    try {
      const environment =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? "testnet"
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? "mainnet"
          : "";

      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      let dkg_options = {
        environment: environment,
        epochsNum: epochs,
        maxNumberOfRetries: 30,
        frequency: 2,
        contentType: "all",
        keywords: `knowledge-miner`,
        blockchain: {
          name: blockchain,
          publicKey: public_key,
          privateKey: private_key,
          handleNotMinedError: true,
        },
      };

      if (paranet_ual) {
        dkg_options.paranetUAL = paranet_ual;
      }

      let asset = await dkg.asset
        .create(content, dkg_options)
        .then((result) => {
          return result;
        })
        .catch(async (error) => {
          error_obj = {
            error: error.message,
            blockchain: blockchain,
            public_key: public_key,
            request: "CREATE",
          };
          throw new Error(JSON.stringify(error_obj));
        });

      console.log(
        `${blockchain} | ${txn_id}:  Wallet ${public_key}: Created UAL ${asset.UAL}...`
      );
      return asset;
    } catch (error) {
      let message = JSON.parse(error.message);
      await handleErrors.handleError(message);
    }
  },
  update: async function update(
    public_key,
    private_key,
    blockchain,
    ual,
    data_obj,
    txn_id
  ) {
    try {
      const environment =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? "testnet"
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? "mainnet"
          : "";

      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      await dkg.asset
        .update(ual, data_obj, {
          environment: environment,
          epochsNum: 1,
          maxNumberOfRetries: 30,
          frequency: 2,
          contentType: "all",
          keywords: `knowledge-miner`,
          blockchain: {
            name: blockchain,
            publicKey: public_key,
            privateKey: private_key,
            handleNotMinedError: true,
          },
        })
        .then((result) => {
          return result;
        })
        .catch(async (error) => {
          console.log(
            `${blockchain} | ${txn_id}: Wallet ${public_key}: Failed to update UAL ${ual}: ${error}`
          );
        });

      console.log(`${blockchain} | ${txn_id}: Wallet ${public_key}: update UAL ${ual}.`);
      return;
    } catch (error) {
      console.log(error);
    }
  },
  transfer: async function transfer(
    public_key,
    private_key,
    blockchain,
    ual,
    txn_id,
    receiver
  ) {
    try {
      const environment =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? "testnet"
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? "mainnet"
          : "";

      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      await dkg.asset
        .transfer(ual, receiver, {
          environment: environment,
          epochsNum: 1,
          maxNumberOfRetries: 30,
          frequency: 2,
          contentType: "all",
          blockchain: {
            name: blockchain,
            publicKey: public_key,
            privateKey: private_key,
            handleNotMinedError: true,
          },
        })
        .then((result) => {
          return result;
        })
        .catch(async (error) => {
          console.log(
            `${blockchain} | ${txn_id}: Wallet ${public_key}: Failed to transfer UAL ${ual}: ${error}`
            );
            error_obj = {
                error: error.message,
                blockchain: blockchain,
                public_key: public_key,
                request: "TRANSFER",
            };
        });

      console.log(
        `${blockchain} | ${txn_id}: Wallet ${public_key}: transferred UAL ${ual}...`
      );
      return;
    } catch (error) {
      console.log(error);
    }
  },
  getBidSuggestion: async function getBidSuggestion(
    data_obj,
    epochs,
    blockchain,
    public_key,
    private_key,
    txn_id
  ) {
    try {
      const environment =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? "testnet"
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? "mainnet"
          : "";

      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      const publicAssertionId = await dkg.assertion.getPublicAssertionId(
        data_obj
      );

      const publicAssertionSize = await dkg.assertion.getSizeInBytes(data_obj);

      const bid_suggestion = await dkg.network
        .getBidSuggestion(publicAssertionId, publicAssertionSize, {
          epochsNum: epochs,
          environment: environment,
          blockchain: {
            name: blockchain,
            publicKey: public_key,
            privateKey: private_key,
          },
          bidSuggestionRange: "med",
        })
        .catch(async (error) => {
          throw new Error(error);
        });

      console.log(`${blockchain} | ${txn_id}: Wallet ${public_key}: Got big suggestion.`);
      return bid_suggestion;
    } catch (error) {
      console.log(error);
    }
  },
  get: async function get(public_key, private_key, blockchain, ual, txn_id) {
    try {
      const environment =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? "testnet"
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? "mainnet"
          : "";

      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      dkg.asset
        .get(ual, {
          environment: environment,
          validate: true,
          maxNumberOfRetries: 30,
          frequency: 1,
          state: "LATEST_FINALIZED",
          blockchain: {
            name: blockchain,
            publicKey: public_key,
            privateKey: private_key,
          },
        })
        .then((result) => {
          return result;
        })
        .catch((error) => {
          console.log(error);
        });

      console.log(
        `${blockchain} | ${txn_id}: Wallet ${public_key}: Getting UAL ${ual}...`
      );
      return;
    } catch (error) {
      console.log(error);
    }
  },
  query: async function query(public_key, blockchain, txn_id) {
    try {
      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      let topic = await randomWords(wordPool);

      let query = `PREFIX schema: <http://schema.org/>

            SELECT ?subject (SAMPLE(?name) AS ?name) (SAMPLE(?description) AS ?description) 
                   (REPLACE(STR(?g), "^assertion:", "") AS ?assertion)
            WHERE {
              GRAPH ?g {
                ?subject schema:name ?name .
                ?subject schema:description ?description .
                
                FILTER(
                  (isLiteral(?name) && CONTAINS(str(?name), "${topic}")) || (isLiteral(?name) && CONTAINS(LCASE(str(?name)), "${topic}")) ||
                  (isLiteral(?description) && CONTAINS(str(?description), "${topic}")) || (isLiteral(?description) && CONTAINS(LCASE(str(?description)), "${topic}"))
                )
              }
              ?ual schema:assertion ?g .
              FILTER(CONTAINS(str(?ual), "${blockchain}"))
            }
            GROUP BY ?subject ?g
            LIMIT 100  
            `;

      console.log(`Querying for ${topic}`);
      await dkg.graph
        .query(query, "SELECT", { graphState: "CURRENT" })
        .then((result) => {
          return result;
        })
        .catch(async (error) => {
          console.log(
            `${blockchain} | Wallet ${public_key}: Failed to query: ${error}`
          );
        });

      console.log(`${blockchain} | ${txn_id}: Wallet ${public_key} queried the DKG.`);
      return;
    } catch (error) {
      console.log(error);
    }
  },
  federatedQuery: async function federatedQuery(
    public_key,
    blockchain,
    ual,
    txn_id
  ) {
    try {
      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      let topic = await randomWords(wordPool);

      let query = `PREFIX schema: <http://schema.org/>

            SELECT ?subject (SAMPLE(?name) AS ?name) (SAMPLE(?description) AS ?description) 
                   (REPLACE(STR(?g), "^assertion:", "") AS ?assertion)
            WHERE {
              GRAPH ?g {
                ?subject schema:name ?name .
                ?subject schema:description ?description .
                
                FILTER(
                  (isLiteral(?name) && CONTAINS(str(?name), "${topic}")) || (isLiteral(?name) && CONTAINS(LCASE(str(?name)), "${topic}")) ||
                  (isLiteral(?description) && CONTAINS(str(?description), "${topic}")) || (isLiteral(?description) && CONTAINS(LCASE(str(?description)), "${topic}"))
                )
              }
              ?ual schema:assertion ?g .
              FILTER(CONTAINS(str(?ual), "${blockchain}"))
            }
            GROUP BY ?subject ?g
            LIMIT 100  
            `;

      console.log(`Federated querying for ${topic}`);
      await dkg.graph
        .query(query, "SELECT", { graphLocation: ual })
        .then((result) => {
          return result;
        })
        .catch(async (error) => {
          console.log(
            `${blockchain} wallet ${public_key}: Failed to query: ${error}`
          );
        });

      console.log(`${blockchain} | ${txn_id}: Wallet ${public_key} queried DKG.`);
      return;
    } catch (error) {
      console.log(error);
    }
  },
  submitToParanet: async function submitToParanet(
    public_key,
    private_key,
    blockchain,
    paranet_ual,
    ual,
    txn_id
  ) {
    try {

      const dkg =
        blockchain === "otp:20430" ||
        blockchain === "gnosis:10200" ||
        blockchain === "base:84532"
          ? testnet_dkg
          : blockchain === "otp:2043" ||
            blockchain === "gnosis:100" ||
            blockchain === "base:8453"
          ? mainnet_dkg
          : "";

      console.log(
        `${blockchain} | ${txn_id}: Wallet ${public_key}: Submitting asset UAL ${ual} to paranet UAL ${paranet_ual}...`
      );

      await dkg.asset
        .submitToParanet(ual, paranet_ual, {
          environment: environment,
          blockchain: {
            name: blockchain,
            publicKey: public_key,
            privateKey: private_key,
          },
        })
        .then((result) => {
          return result;
        })
        .catch((error) => {
          console.log(error);
        });

      console.log(
        `${blockchain} | ${txn_id}: Submitted asset UAL ${ual} to Paranet UAL ${paranet_ual}.`
      );
      return;
    } catch (error) {
      console.log(error);
    }
  },
};
