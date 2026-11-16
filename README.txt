TRINITY ORACLE — PUBLIC HISTORY AND INTEGRATION STARTER

CURRENT STATUS — READ-ONLY HISTORICAL STARTER 0.2.0
The pinned history describes the completed Base Sepolia trial. The original paid
contract has MAX_REQUESTS=3 and all three have been consumed. It does NOT
accept another payment or request. Do not send funds to these addresses.
No production/mainnet service or new source acquisition is activated.
The starter includes Ethers v6, Hardhat and Foundry read-only historical
examples, plus a manual-dispatch verification workflow. Registry metadata
is descriptive only; no external registry submission is implied.

The working outside connection in this release is historical verification.
It is not a completed independently operated paying customer integration.

INSTALL AND RUN
Use the complete files from the versioned starter distribution.
Use Node 22 or newer. Run npm ci --ignore-scripts; this installs the fixed
ethers dependency using the included lockfile. Installation performs no oracle
request or wallet operation.
Run: node verify.mjs --read-public-history
Run the focused template tests: npm test

This explicit command sends only read-only public JSON-RPC requests to:
https://sepolia.base.org
https://base-sepolia-rpc.publicnode.com

No telemetry, local environment values, API credentials, compiler hooks,
wallet keys, transaction signatures or payments are sent. Importing the SDK
does nothing. There is no automatic installation or response code execution.
The optional GWS resonance spark is a separate explicit-consent component and
is not imported or invoked by this starter.

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

ETHERS V6 / STANDARD EVM INTEGRATION
ethers-history.mjs is a read-only Ethers v6 example using an injected provider,
ordinary contract ABI calls, chain-ID checking and a pinned historical block:
node ethers-history.mjs https://sepolia.base.org <paid-contract-address> <block>
Use the historical address and block in binding.mjs. This one-reader metadata
example is not itself a history proof; run the dual-reader SDK verifier above
for the pinned history and example-result checks. It includes no signer,
wallet provider, transaction submission or write-capable ABI.

The Solidity HistoryConsumer is a separate read-only adapter for the same
Base Sepolia trial. Neither example establishes a production contract or
general cross-chain compatibility. Ethereum mainnet and other networks are
not configured or claimed.

CONTRACT INTEGRATION
HistoryConsumer.sol is an optional read-only Solidity adapter for the
Base Sepolia historical paid-trial address in binding.mjs. Its callable views:

* trialBounds() returns (uint256 requestsOpened, uint256 maxRequests).
  The values are read at the eth_call block selected by the caller.
* historicalOrder(bytes32 requestId) returns
  (address payer, uint256 amount, bytes32 quoteHash, uint8 state).
  State values are Unknown=0, Escrowed=1, RevenueDue=2, RefundDue=3,
  RevenuePaid=4, Refunded=5. A refund remains a refund; this adapter does not
  claim successful delivery.

Both views reject chain IDs other than 84532. They do not request randomness,
change state, pay, settle, withdraw, or prove a current service is available.
No deployed HistoryConsumer adapter address is supplied; the original
historical paid contract address is in binding.mjs. Do not deploy or use this
adapter for private capsule purchases as part of this read-only starter.

OPT-IN FRAMEWORK SCAFFOLDS
Framework files are under frameworks/hardhat/ and frameworks/foundry/. They
include a source copy of HistoryConsumer.sol; tests check that each copy exactly
matches the root adapter. No Hardhat, Foundry, or Solidity compiler is bundled.
There are no install, precompile, compile, deployment, or network hooks.

Hardhat: from frameworks/hardhat, use an already-installed Hardhat CLI and a
cached Solidity 0.8.24 compiler with:
  hardhat --config hardhat.config.cjs compile
Compilation is explicit and local when the compiler is cached. The scaffold
does not configure a remote network or deploy contracts. The separately
explicit read script uses the starter's Ethers dependency:
  node read-history.mjs <public-https-rpc> <paid-address> <snapshot-block> [request-id]
It reads only MAX_REQUESTS() and requestsOpened() at the supplied block; an
optional trailing request ID also reads the existing orders(bytes32) view.
The helper uses the paid-trial ABI described by HistoryConsumer, and does not
read from a deployed HistoryConsumer instance.

Foundry: from frameworks/foundry, build only with an existing toolchain and
compiler cache:
  forge build --offline
An explicit read-only `cast call` may query the existing paid-trial address and
the historical block from binding.mjs:
  cast call <paid-address> "MAX_REQUESTS()(uint256)" --rpc-url <https-rpc> --block <snapshot-block>
  cast call <paid-address> "requestsOpened()(uint256)" --rpc-url <https-rpc> --block <snapshot-block>
  cast call <paid-address> "orders(bytes32)(address,uint256,bytes32,uint8)" <request-id> --rpc-url <https-rpc> --block <snapshot-block>
No `forge script`, broadcast, deploy, or wallet command is included.

If a toolchain/compiler is unavailable, skip these optional commands. Do not
install one solely to run this starter. No compile or chain command is run by
installing or importing the package.

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
verify-workflow.yml runs only on manual workflow_dispatch. It installs the
lockfile, runs offline-focused template tests, then explicitly reads public
history. Copy it to .github/workflows/trinity-history.yml only if you choose
to enable that CI. It has read-only repository permissions, no secrets, and
no push, pull-request, or scheduled trigger.

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
This starter's new code is MIT licensed; see LICENSE.txt. template-manifest.json
describes public files and safe defaults. The generated release-manifest.json
is a separate distribution receipt containing SHA-256 file checksums and
preparation/publication status. registry-discovery.json is descriptive
metadata only; it has not been submitted to an external registry.
