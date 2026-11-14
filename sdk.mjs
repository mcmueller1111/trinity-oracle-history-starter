/** Independently usable Base Sepolia history verifier and UNSIGNED integration. */
import { createHash } from "node:crypto";
import { AbiCoder, Interface, getAddress, id, keccak256, toQuantity } from "ethers";

export { publicReader } from "./rpc.mjs";
export { binding, deliveredExample } from "./binding.mjs";
export const TERMS = id("PUBLIC_ORACLE_TEST_V1:ONE_RESULT:FULL_SERVICE_FEE_REFUND_ON_REJECTION_OR_TIMEOUT:NO_GAS_REFUND:NO_PREDICTION_GUARANTEE:OPERATOR_ATTESTED");
export const PAID_ABI = [
  "function delivery() view returns(address)", "function treasury() view returns(address)",
  "function priceWei() view returns(uint256)", "function MAX_REQUESTS() view returns(uint256)",
  "function requestsOpened() view returns(uint256)", "function TERMS() view returns(bytes32)",
  "function liabilities() view returns(uint256)",
  "function orders(bytes32) view returns(address payer,uint256 amount,bytes32 quoteHash,uint8 state)",
  "function pay((address payer,bool choice,bytes32 nonce,bytes32 collectionHash,uint64 start,uint64 end,uint64 validUntil),bytes32,bytes32) payable returns(bytes32)",
  "function settle(bytes32,bytes32)", "function reconcile(bytes32)", "function withdraw(bytes32)",
  "event Paid(bytes32 indexed requestId,address indexed payer,bytes32 quoteHash,uint256 amount,uint64 validUntil,bytes32 termsHash)",
];
export const DELIVERY_ABI = [
  "function oracle() view returns(address)",
  "function terms(bytes32) view returns(address customer,bytes32 inputHash,bytes32 collectionHash,uint64 windowStart,uint64 windowEnd,bool choice,bool committed,bool settled,uint8 failure,bool outcome,bool matched,bytes32 evidenceHash)",
  "event Settled(bytes32 indexed requestId,bool outcome,bool matchedChoice)",
];
export const ORACLE_ABI = [
  "function requests(bytes32) view returns(address requester,bytes32 inputHash,bytes32 commitment,bytes32 contextHash,bytes32 result,uint64 commitDeadline,uint64 revealDeadline,uint64 revealAfter,uint8 status)",
  "event Fulfilled(bytes32 indexed requestId,bytes32 result,bytes32 seed)",
];
const paid = new Interface(PAID_ABI), delivery = new Interface(DELIVERY_ABI), oracle = new Interface(ORACLE_ABI);
const coder = AbiCoder.defaultAbiCoder();
const hash = value => "0x" + createHash("sha256").update(value).digest("hex");
const eq = (a, b) => typeof a === "string" && a.toLowerCase() === String(b).toLowerCase();
const must = (condition, code) => { if (!condition) throw Error(code); };
const states = ["Unknown", "Escrowed", "RevenueDue", "RefundDue", "RevenuePaid", "Refunded"];
const isHash = value => /^0x[0-9a-f]{64}$/i.test(value ?? "");

export function validateBinding(b) {
  must(b?.version === 1 && b.chainId === 84532 && Number.isSafeInteger(b.startBlock)
    && Number.isSafeInteger(b.snapshotBlock) && b.startBlock >= 0 && b.snapshotBlock >= b.startBlock
    && isHash(b.snapshotHash) && isHash(b.deploymentTransaction)
    && Array.isArray(b.paymentTransactions) && b.paymentTransactions.length <= 3
    && b.paymentTransactions.every(isHash)
    && new Set(b.paymentTransactions).size === b.paymentTransactions.length, "EXACT_HISTORY_BINDING_REQUIRED");
  for (const field of ["paid", "delivery", "oracle"]) {
    getAddress(b[field]);
    must(isHash(b[field + "RuntimeHash"]), "PINNED_RUNTIME_REQUIRED");
  }
  return b;
}

async function snapshot(reader, b) {
  must(BigInt(await reader.send("eth_chainId")) === 84532n, "BASE_SEPOLIA_ONLY");
  const tag = toQuantity(b.snapshotBlock);
  const [block, finalized] = await Promise.all([
    reader.send("eth_getBlockByNumber", [tag, false]),
    reader.send("eth_getBlockByNumber", ["finalized", false]),
  ]);
  must(block?.hash === b.snapshotHash && finalized?.number
    && BigInt(finalized.number) >= BigInt(b.snapshotBlock), "FINALIZED_CANONICAL_HISTORY_REQUIRED");
  for (const field of ["paid", "delivery", "oracle"]) {
    must(keccak256(await reader.send("eth_getCode", [b[field], tag])) === b[field + "RuntimeHash"],
      "HISTORICAL_CONTRACT_CODE_MISMATCH");
  }
  return tag;
}

const call = async (reader, contract, abi, method, args, tag) => abi.decodeFunctionResult(method,
  await reader.send("eth_call", [{ to: contract, data: abi.encodeFunctionData(method, args) }, tag]));

async function canonicalReceipt(reader, txHash, b) {
  must(isHash(txHash), "TRANSACTION_HASH_REQUIRED");
  const r = await reader.send("eth_getTransactionReceipt", [txHash]);
  must(r?.status === "0x1" && eq(r.transactionHash, txHash) && r.blockNumber
    && BigInt(r.blockNumber) >= BigInt(b.startBlock) && BigInt(r.blockNumber) <= BigInt(b.snapshotBlock),
  "SUCCESSFUL_HISTORY_RECEIPT_REQUIRED");
  const block = await reader.send("eth_getBlockByNumber", [r.blockNumber, false]);
  must(block?.hash === r.blockHash && Array.isArray(r.logs), "HISTORY_RECEIPT_REORG");
  return r;
}
function eventLogs(receipt, contract, abi, name, requestId) {
  return receipt.logs.filter(log => {
    must(!log.removed && log.blockHash === receipt.blockHash
      && eq(log.transactionHash, receipt.transactionHash), "RECEIPT_LOG_BINDING_MISMATCH");
    if (!eq(log.address, contract) || log.topics[0] !== abi.getEvent(name).topicHash) return false;
    const event = abi.parseLog(log);
    return event?.name === name && (!requestId || event.args.requestId === requestId);
  });
}
function publicRecord(b, receipt, log, args) {
  const document = {
    domain: "TRINITY_PUBLIC_RESULT_COPY_V1", chainId: 84532, contract: b.delivery.toLowerCase(),
    requestId: args.requestId.toLowerCase(), transactionHash: receipt.transactionHash.toLowerCase(),
    blockNumber: Number(BigInt(receipt.blockNumber)), blockHash: receipt.blockHash.toLowerCase(),
    logIndex: Number(BigInt(log.logIndex)), outcome: args.outcome, matchedChoice: args.matchedChoice,
  };
  return {
    receiptId: hash(JSON.stringify([document.domain, 84532, document.contract, document.requestId])),
    fingerprint: hash(JSON.stringify(document)), document,
  };
}

async function oneHistory(reader, b) {
  const tag = await snapshot(reader, b);
  const creation = await canonicalReceipt(reader, b.deploymentTransaction, b);
  must(eq(creation.contractAddress, b.paid) && Number(BigInt(creation.blockNumber)) === b.startBlock,
    "ORIGINAL_CONTRACT_CREATION_REQUIRED");
  const [expectedDelivery, expectedOracle, terms, max, opened, liabilities] = await Promise.all([
    call(reader, b.paid, paid, "delivery", [], tag),
    call(reader, b.delivery, delivery, "oracle", [], tag),
    call(reader, b.paid, paid, "TERMS", [], tag),
    call(reader, b.paid, paid, "MAX_REQUESTS", [], tag),
    call(reader, b.paid, paid, "requestsOpened", [], tag),
    call(reader, b.paid, paid, "liabilities", [], tag),
  ]);
  must(eq(expectedDelivery[0], b.delivery) && eq(expectedOracle[0], b.oracle)
    && terms[0] === TERMS && max[0] === 3n && opened[0] <= max[0], "SUPPORTED_PAID_TRIAL_REQUIRED");
  // The trial is closed at three orders: explicit retained transaction hashes
  // plus the on-chain counter establish completeness without scanning 440k blocks.
  const entries = [];
  for (const transaction of b.paymentTransactions) {
    const receipt = await canonicalReceipt(reader, transaction, b);
    for (const log of eventLogs(receipt, b.paid, paid, "Paid")) entries.push({ receipt, log });
    must(entries.length <= 3, "BOUNDED_PAYMENT_HISTORY_REQUIRED");
  }
  must(BigInt(entries.length) === opened[0], "COMPLETE_PAYMENT_HISTORY_REQUIRED");
  const requests = [];
  for (const { receipt, log } of entries) {
    const { args } = paid.parseLog(log);
    const order = await call(reader, b.paid, paid, "orders", [args.requestId], tag);
    const t = await call(reader, b.delivery, delivery, "terms", [args.requestId], tag);
    must(eq(order.payer, args.payer) && order.amount === args.amount && order.quoteHash === args.quoteHash
      && args.termsHash === TERMS && eq(t.customer, b.paid) && order.state <= 5n,
    "PAYMENT_ORDER_BINDING_MISMATCH");
    requests.push({
      requestId: args.requestId, payer: args.payer, amountWei: args.amount.toString(),
      quoteHash: args.quoteHash, state: states[Number(order.state)],
      paymentTransaction: receipt.transactionHash, inputHash: t.inputHash,
      windowStart: Number(t.windowStart), windowEnd: Number(t.windowEnd),
      settled: t.settled, failure: Number(t.failure),
      outcome: t.settled ? t.outcome : null, matchedChoice: t.settled ? t.matched : null,
    });
  }
  must(new Set(requests.map(r => r.requestId)).size === requests.length, "DUPLICATE_HISTORY_REQUEST");
  return {
    version: 1, chainId: 84532, contract: b.paid, snapshotBlock: b.snapshotBlock,
    snapshotHash: b.snapshotHash, maxRequests: 3, requestsOpened: Number(opened[0]),
    acceptingRequests: false, availability: opened[0] === max[0] ? "TRIAL_EXHAUSTED" : "TRIAL_NOT_ACTIVATED",
    liabilitiesWei: liabilities[0].toString(), requests,
    trust: "ANU-provider-trusted and operator-attested; no independent quantum certification",
  };
}

function checkedReaders(readers) {
  must(Array.isArray(readers) && readers.length === 2 && readers[0] !== readers[1]
    && typeof readers[0].identity === "string" && typeof readers[1].identity === "string"
    && readers[0].identity !== readers[1].identity, "TWO_DISTINCT_RPC_READERS_REQUIRED");
}
export async function readHistory({ readers, binding }) {
  checkedReaders(readers);
  validateBinding(binding);
  const [a, b] = await Promise.all(readers.map(reader => oneHistory(reader, binding)));
  must(JSON.stringify(a) === JSON.stringify(b), "HISTORY_READERS_DISAGREE");
  return { ...a, verification: "TWO_RPC_CANONICAL_FINALIZED_SNAPSHOT" };
}

async function oneResult(reader, b, transactionHash, requestId) {
  const tag = await snapshot(reader, b), receipt = await canonicalReceipt(reader, transactionHash, b);
  const settled = eventLogs(receipt, b.delivery, delivery, "Settled", requestId);
  const fulfilled = eventLogs(receipt, b.oracle, oracle, "Fulfilled", requestId);
  must(settled.length === 1 && fulfilled.length === 1, "SAME_RECEIPT_RESULT_EVENTS_REQUIRED");
  const s = delivery.parseLog(settled[0]).args, f = oracle.parseLog(fulfilled[0]).args;
  const t = await call(reader, b.delivery, delivery, "terms", [requestId], tag);
  const r = await call(reader, b.oracle, oracle, "requests", [requestId], tag);
  must(t.settled && t.committed && t.failure === 0n && r.status === 3n
    && eq(t.customer, b.paid) && eq(r.requester, b.delivery)
    && t.inputHash === r.inputHash && r.contextHash === t.evidenceHash, "SOURCE_REQUEST_BINDING_MISMATCH");
  const fields = [84532, b.oracle, requestId, r.requester, r.inputHash, r.contextHash, f.seed];
  const types = ["bytes32", "uint256", "address", "bytes32", "address", "bytes32", "bytes32", "bytes32"];
  must(keccak256(coder.encode(types, [id("TRINITY_TIMED_TEST_COMMIT_V1"), ...fields])) === r.commitment
    && keccak256(coder.encode(types, [id("TRINITY_TIMED_TEST_RESULT_V1"), ...fields])) === r.result
    && f.result === r.result && Boolean(BigInt(r.result) & 1n) === s.outcome
    && t.outcome === s.outcome && t.matched === s.matchedChoice && s.matchedChoice === (s.outcome === t.choice),
  "RESULT_RECOMPUTATION_MISMATCH");
  return { requestId, result: r.result, seed: f.seed, contextHash: r.contextHash,
    outcome: s.outcome, matchedChoice: s.matchedChoice,
    ...publicRecord(b, receipt, settled[0], s) };
}
export async function verifyResult({ readers, binding, transactionHash, requestId }) {
  checkedReaders(readers); validateBinding(binding);
  must(isHash(requestId), "REQUEST_ID_REQUIRED");
  const [a, b] = await Promise.all(readers.map(reader => oneResult(reader, binding, transactionHash, requestId)));
  must(JSON.stringify(a) === JSON.stringify(b), "RESULT_READERS_DISAGREE");
  return { ...a, verification: "FINALIZED_COMMITMENT_AND_ARITHMETIC",
    physicalQuantumOriginVerified: false, operatorSelectionExcluded: false };
}

/** Does NOT send, sign or fetch. A future active deployment needs its own approval. */
export function prepareUnsignedPayment({ enabled = false, activeDeployment = false, chainId,
  contract, delivery: source, treasury, priceWei, quote, acceptedTerms, acceptedQuote }) {
  must(enabled === true && activeDeployment === true, "EXPLICIT_ACTIVE_SERVICE_OPT_IN_REQUIRED");
  must(chainId === 84532 && acceptedTerms === TERMS && typeof priceWei === "string"
    && /^[1-9][0-9]*$/.test(priceWei), "EXACT_SERVICE_TERMS_REQUIRED");
  const quoteHash = keccak256(coder.encode(
    ["bytes32", "uint256", "address", "address", "address", "uint256", "bytes32",
      "tuple(address payer,bool choice,bytes32 nonce,bytes32 collectionHash,uint64 start,uint64 end,uint64 validUntil)"],
    [id("TRINITY_PAID_ORACLE_QUOTE_V1"), 84532, contract, source, treasury, priceWei, TERMS, quote]));
  must(acceptedQuote === quoteHash, "QUOTE_DOES_NOT_MATCH_TRANSACTION");
  return { chainId: 84532, to: getAddress(contract), value: priceWei,
    data: paid.encodeFunctionData("pay", [quote, quoteHash, TERMS]), requiresCustomerWalletConsent: true };
}
