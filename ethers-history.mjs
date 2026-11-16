/** Ethers v6, read-only historical metadata example; no signer or transaction path. */
import { Contract, JsonRpcProvider, getAddress } from "ethers";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PAID_HISTORY_ABI = [
  "function MAX_REQUESTS() view returns (uint256)",
  "function requestsOpened() view returns (uint256)",
  "function orders(bytes32 id) view returns (address payer,uint256 amount,bytes32 quoteHash,uint8 state)",
];
const ORDER_STATES = ["Unknown", "Escrowed", "RevenueDue", "RefundDue", "RevenuePaid", "Refunded"];

export async function readHistoricalSummary({
  rpcUrl,
  contractAddress,
  snapshotBlock,
  requestId,
  providerFactory = (url) => new JsonRpcProvider(url, 84532, { staticNetwork: true }),
  contractFactory = (address, abi, provider) => new Contract(address, abi, provider),
}) {
  const endpoint = new URL(rpcUrl);
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password
      || endpoint.search || endpoint.hash) throw Error("PUBLIC_HTTPS_READER_REQUIRED");
  const address = getAddress(contractAddress);
  if (!Number.isSafeInteger(snapshotBlock) || snapshotBlock < 0) throw Error("SNAPSHOT_BLOCK_REQUIRED");
  if (requestId !== undefined && !/^0x[0-9a-f]{64}$/i.test(requestId)) throw Error("REQUEST_ID_REQUIRED");

  const provider = providerFactory(endpoint.toString());
  const network = await provider.getNetwork();
  if (network.chainId !== 84532n) throw Error("BASE_SEPOLIA_ONLY");
  if (await provider.getCode(address, snapshotBlock) === "0x") throw Error("HISTORICAL_CODE_REQUIRED");

  const contract = contractFactory(address, PAID_HISTORY_ABI, provider);
  const [maxRequests, requestsOpened] = await Promise.all([
    contract.MAX_REQUESTS({ blockTag: snapshotBlock }),
    contract.requestsOpened({ blockTag: snapshotBlock }),
  ]);
  let historicalOrder;
  if (requestId !== undefined) {
    const order = await contract.orders(requestId, { blockTag: snapshotBlock });
    if (order.state < 0n || order.state >= BigInt(ORDER_STATES.length)) throw Error("UNKNOWN_HISTORICAL_ORDER_STATE");
    historicalOrder = {
      requestId,
      payer: order.payer,
      amountWei: order.amount.toString(),
      quoteHash: order.quoteHash,
      state: ORDER_STATES[Number(order.state)],
    };
  }
  return {
    chainId: 84532,
    contract: address,
    snapshotBlock,
    maxRequests: maxRequests.toString(),
    requestsOpened: requestsOpened.toString(),
    acceptingRequests: false,
    ...(historicalOrder ? { historicalOrder } : {}),
    note: "One-reader historical metadata only; use verify.mjs for canonical dual-reader history verification.",
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , rpcUrl, contractAddress, blockText, requestId] = process.argv;
  const snapshotBlock = Number(blockText);
  if (!rpcUrl || !contractAddress || !/^\d+$/.test(blockText ?? "")) {
    process.stderr.write(
      "Usage: node ethers-history.mjs <public-https-rpc> <paid-address> <snapshot-block> [request-id]\n",
    );
    process.exitCode = 1;
  } else {
    const summary = await readHistoricalSummary({ rpcUrl, contractAddress, snapshotBlock, requestId });
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  }
}
