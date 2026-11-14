TRINITY ORACLE — PUBLIC HISTORY AND INTEGRATION STARTER

CURRENT STATUS
This release verifies the completed Base Sepolia trial. The original paid
contract has MAX_REQUESTS=3 and all three have been consumed. It does NOT
accept another payment or request. Do not send funds to these addresses.
No production/mainnet service or new source acquisition is activated.

The working outside connection in this release is historical verification.
It is not a completed independently operated paying customer integration.

INSTALL AND RUN
Download the versioned starter archive or copy the complete released files.
Use Node 22 or newer. Run npm ci --ignore-scripts; this installs the fixed
ethers dependency using the included lockfile. Installation performs no oracle
request or wallet operation.
Run: node verify.mjs --read-public-history

This explicit command sends only read-only public JSON-RPC requests to:
https://sepolia.base.org
https://base-sepolia-rpc.publicnode.com

No telemetry, local environment values, API credentials, compiler hooks,
wallet keys, transaction signatures or payments are sent. Importing the SDK
does nothing. There is no automatic installation or response code execution.

WHAT IT CHECKS
binding.mjs pins the exact historical block, its hash, the original paid,
delivery and oracle contracts, and all three deployed runtime hashes.
The SDK checks two separately configured RPC readers for chain ID, canonical
block, finalized height, runtime code, complete bounded payment-event history,
each successful payment receipt and the corresponding historical order/terms.
The lower bound is the actual contract creation receipt, not the later IOTA
mirror's scan start. Three retained payment transaction hashes are included
in binding.mjs; each receipt is checked independently, its request ID must be
unique, and their event count must equal requestsOpened at the pinned block.
This accounts for all three orders without scanning hundreds of thousands of
empty blocks. An omitted/duplicate payment fails instead of hiding a refund.
Refunds remain in the history; they are not relabeled successful deliveries.

For the delivered example it checks the same-receipt settlement and reveal
events, source request binding and commitment/result arithmetic. It also
recreates the exact public receipt ID and fingerprint used by the IOTA mirror.
The script can run from an outside machine without a Trinity login or Ark.
It does not need Trinity's web API to establish these chain observations.

TRUST AND LIMITS
This is a pinned historical snapshot, not a current uptime or balance claim.
Finality depends on the selected RPC responses. Two different URLs do not
prove that their infrastructure has independent operators.
The calculation checks do not certify physical quantum origin, eliminate
operator seed selection/withholding, or independently authenticate ANU.
Public NOAA/weather observations add no private entropy or quantum proof.
No comparative security, zero-cost, guaranteed adoption, front-running
prevention, universal-chain compatibility or income claim is made.

IOTA EVM TESTNET
The existing IOTA connection copies finalized Base result fingerprints.
It is not a customer request/payment path and creates no cross-chain guarantee.
This starter's source result/fingerprint check runs on Base Sepolia.
Use the project's separate IOTA receipt verification for the mirror itself.

CONTRACT INTEGRATION
HistoryConsumer.sol is an optional read-only Solidity adapter for Base Sepolia.
Compile it with Solidity 0.8.24 or a compatible version. Compilation sends no
signal. Deploying any contract costs gas and needs separate wallet consent.
No deployment is needed for the Node verifier.
Do not use this adapter for private capsule purchases.

UNSIGNED FUTURE PAYMENT INTERFACE
prepareUnsignedPayment builds data only. It requires explicit enablement,
an operator-confirmed active deployment configuration and exact accepted terms
and quote. It never sends or signs and does not establish service availability.
The caller must independently check the deployment, capacity, quote expiry,
chain, full fees and refund terms before requesting its customer's wallet.
It must journal the chosen nonce and reconcile an existing transaction rather
than resubmit or redraw after an interruption.
No active deployment configuration is supplied in this historical release.
The legacy exhausted address is not a usable new-customer service.

NEW-CUSTOMER REQUIREMENTS STILL TO COMPLETE
A separately approved new contract/source scope; public payment-bound source
admission; an actual durable unattended source-to-delivery/refund worker with
scoped signing and operating funds; and one independently controlled outside
application/wallet completing the whole request/payment/result/check path.
An owner self-test, a process Ark runs, a directory or an ABI is not that result.

OPTIONAL WORKFLOW
verify-workflow.yml is manual-dispatch only. It needs the starter committed
at the repository root; the release includes its reviewed package-lock.json.
Copy it to .github/workflows/verify.yml only if you choose to enable that CI.
It has read-only repository permissions, no secrets and no scheduled job.

API
The Trinity web application's new catalog/history/starter endpoints require
publishing the matching build before the existing public URL serves them.
No directory approval or active customer service is implied by this release.

ORIGINAL CONTRACT SOURCE REGISTRY
The original paid-trial source was submitted to Sourcify and received exact
creation-bytecode and runtime-bytecode matches on Base Sepolia:
https://sourcify.dev/server/v2/contract/84532/0xf12a01adccc070d1319899e7da74a92c60380ba9
This is source verification in a technical registry, not an independent
security audit, an ecosystem endorsement or a new working paid integration.

LICENSE
This starter's new code is MIT licensed; see LICENSE.txt.
