const fs = require("fs");
const path = require("path");
const configPath = path.resolve(__dirname, "../config/.miner_config.json");
const miner_config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const queryTypes = require("../util/queryTypes.js");
const queryDB = queryTypes.queryDB();
const handleErrors = require("../util/handleErrors.js");
const dkg_asset = require("../dkg/asset.js");
const dkg_paranet = require("../dkg/paranet.js");
const miners = miner_config.miners;
const environment = miner_config.environment;
const max_trac_cost = miner_config.max_trac_cost;
const price_check = miner_config.price_check;

// Base URL for our ontology - you would replace this with your actual domain
const SCHEMA_ORG = "https://schema.org/";

// Helper function to convert regular JSON to JSON-LD with public/private separation
function enhanceWithJsonLd(data, txnId) {
  // Extract player info and events
  let playerInfo = data[0];
  let events = data.slice(1);

  // Make sure playerInfo exists and has expected properties
  if (!playerInfo || typeof playerInfo !== 'object') {
    throw new Error(`Invalid player info data: ${JSON.stringify(playerInfo)}`);
  }

  // Safe access to playerInfo properties with defaults
  const safePlayerId = playerInfo.playerId || 'unknown';
  const safePlayerName = playerInfo.playerName || 'unknown';
  const safeTotalLevel = playerInfo.totalLevel || 0;
  const safeCombatLevel = playerInfo.combatLevel || 0;
  const safeTotalXp = playerInfo.totalXp || 0;

  // Convert playerId to string for safe operations
  const playerIdString = String(safePlayerId);
  const truncatedPlayerId = playerIdString.substring(0, 8);

  // Define common context for both public and private data
  const jsonLdContext = {
    "schema": SCHEMA_ORG,
    "xsd": "https://www.w3.org/2001/XMLSchema#"
  };
  
  // Current timestamp for consistency
  const timestamp = new Date().toISOString();
  
  // Create a minimal public data structure with only basic information
  // No detailed player info, no event details
  const publicData = {
    "@context": jsonLdContext,
    "@id": `schema:action/${txnId}`,
    "@type": "schema:Action",
    "schema:identifier": txnId,
    "schema:startTime": timestamp,
    // Minimal player info for public data
    "schema:agent": {
      "@id": `schema:person/${truncatedPlayerId}`,
      "@type": "schema:Person",
      "schema:identifier": truncatedPlayerId
    },
    // Just event count, no details
    "schema:description": `MindRune data with ${events.length} events`,
    // Metadata for knowledge graph
    "schema:mainEntityOfPage": {
      "@type": "schema:Dataset",
      "schema:name": "MindRune Player Data",
      "schema:description": "OSRS gameplay data collected by MindRune Plugin",
      "schema:creator": {
        "@type": "schema:Organization",
        "schema:name": "MindRune Plugin"
      }
    }
  };

  // Create proper JSON-LD for private data - clean and minimal structure
  const privateData = {
    "@context": jsonLdContext,
    "@id": `schema:dataset/${txnId}/private`,
    "@type": "schema:Dataset",
    "schema:identifier": `${txnId}-private`,
    "schema:name": "Private MindRune Data",
    "schema:description": `Complete player data for ${safePlayerName}`,
    "schema:dateCreated": timestamp,
    // Full player information
    "schema:author": {
      "@type": "schema:Person",
      "schema:identifier": safePlayerId,
      "schema:name": safePlayerName,
      "schema:additionalProperty": [
        {
          "@type": "schema:PropertyValue",
          "schema:name": "totalLevel",
          "schema:value": safeTotalLevel
        },
        {
          "@type": "schema:PropertyValue",
          "schema:name": "combatLevel",
          "schema:value": safeCombatLevel
        },
        {
          "@type": "schema:PropertyValue",
          "schema:name": "totalXp",
          "schema:value": safeTotalXp
        }
      ]
    }
    // We will add events below
  };
  
  // Add a limited number of events (to avoid size issues)
  // Each event is a properly structured JSON-LD object
  const maxEvents = Math.min(events.length, 200);
  privateData["schema:hasPart"] = [];
  
  for (let i = 0; i < maxEvents; i++) {
    const event = events[i];
    if (!event || typeof event !== 'object') continue;
    
    const eventType = event.eventType || 'unknown';
    const eventTimestamp = event.timestamp || timestamp;
    
    // Create a simple event object with proper JSON-LD structure
    const eventObj = {
      "@type": "schema:Event",
      "schema:identifier": `${txnId}-event-${i}`,
      "schema:startTime": eventTimestamp,
      "schema:name": eventType
    };
    
    // Add details if available
    if (event.details && typeof event.details === 'object') {
      eventObj["schema:additionalProperty"] = Object.entries(event.details)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => ({
          "@type": "schema:PropertyValue",
          "schema:name": key,
          "schema:value": value
        }));
    }
    
    // Add location if available
    if (event.playerLocation) {
      eventObj["schema:location"] = {
        "@type": "schema:Place",
        "schema:additionalProperty": [
          {
            "@type": "schema:PropertyValue",
            "schema:name": "x",
            "schema:value": event.playerLocation.x || 0
          },
          {
            "@type": "schema:PropertyValue",
            "schema:name": "y",
            "schema:value": event.playerLocation.y || 0
          },
          {
            "@type": "schema:PropertyValue",
            "schema:name": "plane",
            "schema:value": event.playerLocation.plane || 0
          }
        ]
      };
    }
    
    // Add to event list
    privateData["schema:hasPart"].push(eventObj);
  }
  
  // Add event summary information
  privateData["schema:numberOfItems"] = events.length;
  privateData["schema:additionalProperty"] = [
    {
      "@type": "schema:PropertyValue",
      "schema:name": "eventTypes",
      "schema:value": [...new Set(events.map(e => e.eventType || 'unknown'))]
    }
  ];
  
  // If we had to limit events, add that info
  if (events.length > maxEvents) {
    privateData["schema:description"] += ` (showing ${maxEvents} of ${events.length} events)`;
  }
  
  return { 
    public: publicData,
    private: privateData
  };
}

// Helper function to safely parse JSON
function safeJsonParse(jsonString) {
  if (typeof jsonString !== 'string') {
    return jsonString; // Already an object, return as is
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error.message}`);
  }
}

module.exports = {
  uploadData: async function uploadData(data) {
    try {
      let index = miners.findIndex((obj) => obj.public_key == data.miner);
      let query;

      console.log(
        `${data.blockchain} | ${data.txn_id}: ${miners[index].name} wallet ${miners[index].public_key}: Publishing next asset.`
      );

      if (
        (data.blockchain === "otp:20430" ||
          data.blockchain === "gnosis:10200" ||
          data.blockchain === "base:84532") &&
        !environment === "testnet"
      ) {
        throw new Error(
          `${data.blockchain} | ${data.txn_id}: Found asset for invalid environment.`
        );
      }

      if (
        (data.blockchain === "otp:2043" ||
          data.blockchain === "gnosis:100" ||
          data.blockchain === "base:8543") &&
        !environment === "mainnet"
      ) {
        throw new Error(
          `${data.blockchain} | ${data.txn_id}: Found asset for invalid environment.`
        );
      }

      query = "select * FROM data_header WHERE data_id = ?";
      params = [data.data_id];
      let content = await queryDB
        .getData(query, params)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
      
      if (!content || content.length === 0) {
        throw new Error(`${data.blockchain} | ${data.txn_id}: No data found for data_id ${data.data_id}`);
      }

      content = content[0].asset_data;
      
      // Parse content to JSON using the safe parser
      const parsedContent = safeJsonParse(content);
      
      // Transform to JSON-LD format with public/private separation
      const contentObject = enhanceWithJsonLd(parsedContent, data.txn_id);

      query =
        "select ual FROM txn_header WHERE progress = ? AND receiver = ? order by updated_at desc";
      params = ["COMPLETE", data.receiver];
      let parent_ual = await queryDB
        .getData(query, params)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });
      
      // Add parent reference if available
      if (parent_ual.length > 0) {
        contentObject.public["schema:isPartOf"] = {
          "@type": "schema:CreativeWork",
          "schema:identifier": parent_ual[0].ual
        };
        
        if (contentObject.private) {
          contentObject.private["schema:isPartOf"] = {
            "@type": "schema:CreativeWork",
            "schema:identifier": parent_ual[0].ual
          };
        }
      }

      if (price_check) {
        const bid_suggestion = await dkg_asset.getBidSuggestion(
          contentObject,
          data.epochs,
          data.blockchain,
          miners[index].public_key,
          miners[index].private_key,
          data.txn_id
        );

        let asset_cost = Number(bid_suggestion.data) / 1e18;
        if (asset_cost > Number(max_trac_cost)) {
          throw new Error(
            `${data.blockchain} | ${data.txn_id}: Asset cost ${asset_cost} is greater than maximum allowed cost ${max_trac_cost}.`
          );
        }
      }

      let txn_fee = 0;
      let trac_fee = 0;
      let txn_hash = {
        create: "",
        paranet: "",
        transfer: "",
      };

      const created_asset = await dkg_asset.create(
        contentObject,
        data.epochs,
        data.blockchain,
        miners[index].public_key,
        miners[index].private_key,
        data.paranet_ual,
        data.txn_id
      );

      if (!created_asset) {
        return;
      }

      //TO DO: l1Fee needs fed through ethers for numeric number
      //txn_fee = txn_fee + created_asset.operation.mintKnowledgeCollection.l1Fee
      //trac_fee = trac_fee + created_asset.operation.mintKnowledgeCollection.l1Fee

      txn_hash.create =
        created_asset.operation.mintKnowledgeCollection.transactionHash;

      query = `UPDATE txn_header SET progress = ?, ual = ?, txn_hash = ? WHERE txn_id = ?`;
      params = [
        "CREATED",
        created_asset.UAL,
        JSON.stringify(txn_hash),
        data.txn_id,
      ];
      await queryDB
        .getData(query, params)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

        // console.log(
        //   `${data.blockchain} | ${data.txn_id}: ${miners[index].name} wallet ${miners[index].public_key}: Transferring UAL ${created_asset.UAL}...`
        // );

        // const transfer_asset = await dkg_asset.transfer(
        //   miners[index].public_key,
        //   miners[index].private_key,
        //   data.blockchain,
        //   created_asset.UAL+'/1',
        //   data.txn_id,
        //   data.receiver
        // );

        // txn_hash.transfer =
        // transfer_asset.operation.transactionHash;

        query = `UPDATE txn_header SET progress = ?, txn_hash = ?, txn_fee = ?, trac_fee = ? WHERE txn_id = ?`;
      params = [
        "COMPLETE",
        JSON.stringify(txn_hash),
        txn_fee,
        trac_fee,
        data.txn_id,
      ];
      await queryDB
        .getData(query, params)
        .then((results) => {
          return results;
        })
        .catch((error) => {
          console.error("Error retrieving data:", error);
        });

      console.log(
        `${data.blockchain} | ${data.txn_id}: ${miners[index].name} wallet ${miners[index].public_key}: Finished publishing UAL ${created_asset.UAL}.`
      );

      return;
    } catch (error) {
      // Safely handle the error
      try {
        // Check if error.message is valid JSON before parsing
        let message = JSON.parse(error.message);
        await handleErrors.handleError(message);
      } catch (parseError) {
        // If error.message isn't valid JSON, pass the error directly
        console.error('Error handling error:', error.message);
        await handleErrors.handleError({
          message: error.message,
          error: error.toString(),
          blockchain: data?.blockchain || 'unknown',
          txn_id: data?.txn_id || 'unknown'
        });
      }
    }
  },
};