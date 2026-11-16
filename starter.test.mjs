import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const sdkPath = fs.existsSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  "../src/index.mjs")) ? "../src/index.mjs" : "./sdk.mjs";
const { binding, prepareUnsignedPayment } = await import(sdkPath);
import { readHistoricalSummary } from "./ethers-history.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

test("unsigned-payment scaffold remains disabled by default and without active deployment", () => {
  assert.throws(() => prepareUnsignedPayment({}), /EXPLICIT_ACTIVE_SERVICE_OPT_IN_REQUIRED/);
  assert.throws(() => prepareUnsignedPayment({
    enabled: true, activeDeployment: false, chainId: 84532,
  }), /EXPLICIT_ACTIVE_SERVICE_OPT_IN_REQUIRED/);
});

test("Ethers example calls only historical view methods and rejects other chains", async () => {
  const calls = [];
  const summary = await readHistoricalSummary({
    rpcUrl: "https://example.org/rpc",
    contractAddress: binding.paid,
    snapshotBlock: binding.snapshotBlock,
    providerFactory: () => ({
      getNetwork: async () => ({ chainId: 84532n }),
      getCode: async (address, block) => {
        calls.push(["getCode", address, block]);
        return "0x6000";
      },
    }),
    contractFactory: (_address, abi, _provider) => {
      assert.ok(abi.every((line) => line.startsWith("function ") && line.includes(" view ")));
      return {
        MAX_REQUESTS: async (options) => { calls.push(["MAX_REQUESTS", options]); return 3n; },
        requestsOpened: async (options) => { calls.push(["requestsOpened", options]); return 3n; },
      };
    },
  });
  assert.equal(summary.acceptingRequests, false);
  assert.equal(summary.maxRequests, "3");
  assert.equal(summary.requestsOpened, "3");
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call[0] === "getCode" || call[1].blockTag === binding.snapshotBlock));

  const requestId = "0x" + "44".repeat(32);
  const orderSummary = await readHistoricalSummary({
    rpcUrl: "https://example.org/rpc",
    contractAddress: binding.paid,
    snapshotBlock: binding.snapshotBlock,
    requestId,
    providerFactory: () => ({
      getNetwork: async () => ({ chainId: 84532n }),
      getCode: async () => "0x6000",
    }),
    contractFactory: () => ({
      MAX_REQUESTS: async () => 3n,
      requestsOpened: async () => 3n,
      orders: async (id, options) => {
        assert.equal(id, requestId);
        assert.equal(options.blockTag, binding.snapshotBlock);
        return {
          payer: "0x0000000000000000000000000000000000000001",
          amount: 1n,
          quoteHash: "0x" + "55".repeat(32),
          state: 5n,
        };
      },
    }),
  });
  assert.equal(orderSummary.historicalOrder.state, "Refunded");
  assert.equal(orderSummary.historicalOrder.amountWei, "1");

  await assert.rejects(readHistoricalSummary({
    rpcUrl: "https://example.org/rpc",
    contractAddress: binding.paid,
    snapshotBlock: binding.snapshotBlock,
    providerFactory: () => ({
      getNetwork: async () => ({ chainId: 1n }),
      getCode: async () => assert.fail("Wrong chain must fail before reading contract code"),
    }),
  }), /BASE_SEPOLIA_ONLY/);
});

test("manual workflow and public template manifest preserve read-only distribution boundaries", () => {
  const workflow = fs.readFileSync(path.join(here, "verify-workflow.yml"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(here, "template-manifest.json"), "utf8"));
  const registry = JSON.parse(fs.readFileSync(path.join(here, "registry-discovery.json"), "utf8"));
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s*(push|pull_request|schedule):/m);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /node verify\.mjs --read-public-history/);
  assert.doesNotMatch(workflow, /secrets\./i);
  assert.equal(manifest.status, "READ_ONLY_HISTORICAL_VERIFICATION");
  assert.equal(manifest.registryDiscoveryMetadata, "registry-discovery.json");
  assert.equal(manifest.defaultEffects.automaticPayment, false);
  assert.equal(manifest.defaultEffects.telemetry, false);
  assert.equal(manifest.supportedExample.activeCustomerService, false);
  assert.ok(manifest.excluded.includes("private capsule payloads and keys"));
  assert.equal(registry.schema, "trinity.public-history-discovery/v1");
  assert.equal(registry.registrySubmissionStatus, "NOT_SUBMITTED");
  assert.equal(registry.supportedNetworks[0].chainId, 84532);
  assert.equal(registry.historicalSnapshot.acceptingRequests, false);
  assert.equal(registry.historicalSnapshot.blockNumber, binding.snapshotBlock);
  assert.equal(registry.historicalSnapshot.blockHash, binding.snapshotHash);
  assert.deepEqual(registry.offers.activePublicOracleOffers, []);
  assert.deepEqual(registry.offers.activePrivateCapsuleOffers, []);
  for (const [role, addressField, hashField] of [
    ["historical-paid-trial", "paid", "paidRuntimeHash"],
    ["historical-delivery-test", "delivery", "deliveryRuntimeHash"],
    ["historical-oracle-test", "oracle", "oracleRuntimeHash"],
  ]) {
    const contract = registry.contracts.find((item) => item.role === role);
    assert.equal(contract.address.toLowerCase(), binding[addressField].toLowerCase());
    assert.equal(contract.runtimeKeccak256.toLowerCase(), binding[hashField].toLowerCase());
  }
  for (const link of ["publicReferenceRepository", "publicReferenceRelease", "documentation",
    "historicalConsumerSource", "historicalBinding", "paidContractSourceVerification"]) {
    assert.match(registry.links[link], /^https:\/\//);
  }
  const sourceRelatives = {
    "sdk.mjs": "../src/index.mjs",
    "rpc.mjs": "../src/rpc.mjs",
    "binding.mjs": "../src/binding.mjs",
    "README.txt": "../README.txt",
    "LICENSE.txt": "../LICENSE.txt",
  };
  for (const file of manifest.publicFiles) {
    const localPath = path.join(here, file);
    const sourcePath = path.join(here, sourceRelatives[file] ?? file);
    assert.ok(fs.existsSync(localPath) || fs.existsSync(sourcePath), `manifest file missing: ${file}`);
  }
});

test("Hardhat and Foundry scaffolds are explicit copies of the historical read-only adapter", () => {
  const source = fs.readFileSync(path.join(here, "HistoryConsumer.sol"), "utf8");
  for (const consumer of [
    "frameworks/hardhat/contracts/HistoryConsumer.sol",
    "frameworks/foundry/src/HistoryConsumer.sol",
  ]) {
    assert.equal(fs.readFileSync(path.join(here, consumer), "utf8"), source);
  }
  assert.match(source, /function trialBounds\(\) external view/);
  assert.match(source, /function historicalOrder\(bytes32 requestId\) external view/);
  assert.doesNotMatch(source, /function\s+\w+[^;{]*\bpayable\b|\breceive\s*\(|\bfallback\s*\(|\b(transfer|approve)\s*\(/);
  const hardhatConfig = fs.readFileSync(path.join(here, "frameworks/hardhat/hardhat.config.cjs"), "utf8");
  const foundryConfig = fs.readFileSync(path.join(here, "frameworks/foundry/foundry.toml"), "utf8");
  const packageJson = JSON.parse(fs.readFileSync(path.join(here, "package.json"), "utf8"));
  assert.doesNotMatch(hardhatConfig, /\b(networks|accounts|url)\s*:/);
  assert.match(foundryConfig, /^offline = true$/m);
  assert.match(foundryConfig, /^ffi = false$/m);
  assert.ok(Object.keys(packageJson.scripts).every((name) =>
    !/^(pre|post)(install|compile|deploy)$/.test(name)));
  assert.ok(fs.existsSync(path.resolve(here, "frameworks/hardhat", "../../ethers-history.mjs")));
  assert.ok(fs.existsSync(path.join(here, "frameworks/hardhat/read-history.mjs")));
  assert.ok(fs.existsSync(path.join(here, "frameworks/foundry/src/HistoryConsumer.sol")));
});
