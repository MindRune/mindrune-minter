const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../config/.miner_config.json");
const miner_config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const DKGClient = require("dkg.js");
const dkg_asset = require("./asset.js");
const testnet_host = miner_config.testnet_host;
const mainnet_host = miner_config.mainnet_host;
const testnet_port = miner_config.testnet_port;
const mainnet_port = miner_config.mainnet_port;
const useSSL = miner_config.useSSL;
const handleErrors = require("../util/handleErrors.js");

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

module.exports = {
  createParanet: async function createParanet(
    public_key,
    private_key,
    blockchain,
    ual,
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

      let paranet_result = await dkg.paranet
        .create(ual, {
          paranetName: ual,
          paranetDescription: `Test Paranet: ${ual}`,
          environment: environment,
          paranetNodesAccessPolicy: 1,
          paranetMinersAccessPolicy: 1,
          blockchain: {
            name: blockchain,
            publicKey: public_key,
            privateKey: private_key,
          },
        })
        .catch(async (error) => {
          error_obj = {
            error: error.message,
            blockchain: blockchain,
            public_key: public_key,
            request: "CREATE-PARANET",
          };
          throw new Error(JSON.stringify(error_obj));
        });

      console.log(
        `${blockchain} | ${txn_id}: Wallet ${public_key}: Created paranet from UAL ${ual}.`
      );
      return paranet_result;
    } catch (error) {
      let message = JSON.parse(error.message);
      await handleErrors.handleError(message);
    }
  },
  deployIncentivesContract: async function deployIncentivesContract(
    public_key,
    private_key,
    blockchain,
    ual,
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

      await dkg.paranet.deployIncentivesContract(ual, "Neuroweb", {
        tracToNeuroEmissionMultiplier: "2",
        operatorRewardPercentage: "10",
        incentivizationProposalVotersRewardPercentage: "10",
        paranetNodesAccessPolicy: 0,
        paranetMinersAccessPolicy: 0,
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
      });

      console.log(
        `${blockchain} | ${txn_id}: Finished deployIncentivesContract for paranet UAL ${ual}.`
      );
      return;
    } catch (error) {
      console.log(error);
    }
  },
  createService: async function createService(
    public_key,
    private_key,
    blockchain,
    ual,
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

      const created_asset = await dkg_asset.create(
        {
          public: {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: "Paranet Service",
            description: "Paranet Service description",
          },
        },
        1,
        blockchain,
        public_key,
        private_key,
        txn_id
      );

      if (!created_asset) {
        return;
      }

      await dkg.paranet.createService(created_asset.UAL, {
        paranetServiceName: "UBER SERVICE",
        paranetServiceDescription: "UBER SERVICE DESCRIPTION",
        paranetServiceAddresses: [],
      });

      console.log(
        `${blockchain} | ${txn_id}: Created service UAL ${created_asset.UAL}.`
      );
      return created_asset.UAL;
    } catch (error) {
      console.log(error);
    }
  },
  addServices: async function addServices(
    public_key,
    private_key,
    blockchain,
    ual,
    service_ual,
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

      await dkg.paranet.addServices(ual, [service_ual], {
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
      });

      console.log(
        `${blockchain} | ${txn_id}: Added service UAL ${service_ual}.`
      );
      return;
    } catch (error) {
      console.log(error);
    }
  },
  isKnowledgeMiner: async function isKnowledgeMiner(
    public_key,
    private_key,
    blockchain,
    ual,
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

      const isMiner = await dkg.paranet.isKnowledgeMiner(ual, {
        roleAddress: public_key,
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
      });
      console.log(`${blockchain} | ${txn_id}: Is Knowledge Miner:`, isMiner);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  isParanetOperator: async function isParanetOperator(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Check if an address is a paranet operator
      const isOperator = await dkg.paranet.isParanetOperator(ual, {
        roleAddress: public_key,
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
      });
      console.log(`${blockchain} | ${txn_id}: Is Paranet Operator:`, isOperator);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  isProposalVoter: async function isProposalVoter(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Check if an address is a voter
      const isVoter = await dkg.paranet.isProposalVoter(ual, {
        roleAddress: public_key,
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
      });
      console.log(`${blockchain} | ${txn_id}: Is Proposal Voter:`, isVoter);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  getClaimableMinerReward: async function getClaimableMinerReward(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Check claimable Knowledge miner rewards
      const claimableMinerRewards = await dkg.paranet.getClaimableMinerReward(
        ual,
        {
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
        }
      );
      console.log(`${blockchain} | ${txn_id}: Claimable Miner Reward:`, claimableMinerRewards);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  claimMinerReward: async function claimMinerReward(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Claim miner rewards
      await dkg.paranet.claimMinerReward(ual, {
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
      });
      console.log(`${blockchain} | ${txn_id}: Miner rewards claimed successfully!`);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  getClaimableVoterReward: async function getClaimableVoterReward(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Check claimable operator rewards
      const claimableVoterRewards = await dkg.paranet.getClaimableVoterReward(
        ual,
        {
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
        }
      );
      console.log(`${blockchain} | ${txn_id}: Claimable Voter Reward:`, claimableVoterRewards);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  claimVoterReward: async function claimVoterReward(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Claim voter rewards
      await dkg.paranet.claimVoterReward(ual, {
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
      });
      console.log(`${blockchain} | ${txn_id}: Voter rewards claimed successfully!`);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  getClaimableOperatorReward: async function getClaimableOperatorReward(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Check claimable operator rewards
      const claimableOperatorRewards =
        await dkg.paranet.getClaimableOperatorReward(ual, {
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
        });
      console.log(`${blockchain} | ${txn_id}: Claimable Operator Reward:`, claimableOperatorRewards);

      return;
    } catch (error) {
      console.log(error);
    }
  },
  claimOperatorReward: async function claimOperatorReward(
    public_key,
    private_key,
    blockchain,
    ual,
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

      // Claim operator rewards
      await dkg.paranet.claimOperatorReward(ual, {
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
      });
      console.log(`${blockchain} | ${txn_id}: Operator rewards claimed successfully!`);

      return;
    } catch (error) {
      console.log(error);
    }
  },
};
