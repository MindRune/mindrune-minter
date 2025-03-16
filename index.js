const fs = require('fs');
const path = require('path');
const configPath = path.resolve(__dirname, './config/.miner_config');
const miner_config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const uploadData = require('./src/uploadData.js');
const getPendingUploadRequests = require('./src/getPendingUploadRequests.js');
const miners = miner_config.miners
const miner_cycle_time_sec = miner_config.miner_cycle_time_sec

async function processPendingUploads() {
  try {
    setTimeout(processPendingUploads, miner_cycle_time_sec * 1000);
    const pending_requests = await getPendingUploadRequests.getPendingUploadRequests();

    if (Number(pending_requests.length) === 0) {
      return;
    }

    const promises = pending_requests.map((request) => uploadData.uploadData(request));

    const concurrentUploads = miners.length + 100;
    await Promise.all(promises.slice(0, concurrentUploads));
  } catch (error) {
    console.error("Error publishing assets:", error);
  }
}

processPendingUploads();
