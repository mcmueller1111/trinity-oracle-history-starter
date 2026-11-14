/** Read-only transport. No wallet, environment, signing, collection or auto-start. */
const METHODS = new Set(["eth_chainId", "eth_getBlockByNumber", "eth_getCode",
  "eth_getLogs", "eth_getTransactionReceipt", "eth_call"]);

export function publicReader(endpoint, fetcher = globalThis.fetch) {
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
    throw Error("PUBLIC_HTTPS_READER_REQUIRED");
  let next = 0, calls = 0;
  const deadline = Date.now() + 60000;
  return {
    identity: url.origin + url.pathname,
    async send(method, params = []) {
      if (!METHODS.has(method)) throw Error("READ_ONLY_METHOD_REQUIRED");
      if (++calls > 128) throw Error("READ_BUDGET_EXCEEDED");
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw Error("READ_TIME_BUDGET_EXCEEDED");
      const id = ++next;
      const response = await fetcher(endpoint, {
        method: "POST", redirect: "error", signal: AbortSignal.timeout(Math.min(12000, remaining)),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      });
      if (!response.ok || !response.body) throw Error("PUBLIC_READER_UNAVAILABLE");
      let size = 0;
      const chunks = [];
      const reader = response.body.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if ((size += value.byteLength) > 524288) throw Error("PUBLIC_RESPONSE_BOUND");
          chunks.push(Buffer.from(value));
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (body.jsonrpc !== "2.0" || body.id !== id || body.error || !Object.hasOwn(body, "result"))
        throw Error("PUBLIC_READER_INVALID_RESPONSE");
      return body.result;
    },
  };
}
