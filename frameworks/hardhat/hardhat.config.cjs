// Opt-in local compile configuration. No plugins, tasks, remote networks, or hooks.
const path = require("node:path");

module.exports = {
  solidity: { version: "0.8.24" },
  paths: {
    sources: path.join(__dirname, "contracts"),
    tests: path.join(__dirname, "test"),
    cache: path.join(__dirname, "cache"),
    artifacts: path.join(__dirname, "artifacts"),
  },
};
