/** Explicit read-only starter. Importing does nothing. No telemetry or payments. */
import { readHistory, verifyResult, publicReader } from "./sdk.mjs";
import { binding, deliveredExample } from "./binding.mjs";
if (process.argv[2] !== "--read-public-history") {
  process.stderr.write("Opt in explicitly: node verify.mjs --read-public-history\n");
  process.exitCode = 1;
} else {
  const readers = ["https://sepolia.base.org", "https://base-sepolia-rpc.publicnode.com"].map(u => publicReader(u));
  const history = await readHistory({ readers, binding });
  const result = await verifyResult({ readers, binding, ...deliveredExample });
  process.stdout.write(JSON.stringify({ history, result }, null, 2) + "\n");
}
