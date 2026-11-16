/** Explicit read-only view of the historical paid contract, not a consumer deployment. */
import { readHistoricalSummary } from "../../ethers-history.mjs";

const [, , rpcUrl, contractAddress, blockText, requestId] = process.argv;
const snapshotBlock = Number(blockText);
if (!rpcUrl || !contractAddress || !/^\d+$/.test(blockText ?? "")) {
  process.stderr.write(
    "Usage: node read-history.mjs <public-https-rpc> <paid-address> <snapshot-block> [request-id]\n",
  );
  process.exitCode = 1;
} else {
  const summary = await readHistoricalSummary({ rpcUrl, contractAddress, snapshotBlock, requestId });
  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
}
