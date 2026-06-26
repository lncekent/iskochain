import * as StellarSdk from "@stellar/stellar-sdk";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

export const NETWORK = "TESTNET";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

// USDC on Stellar Testnet
export const USDC_ASSET_CODE = "USDC";
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const CONTRACT_ID = "CBTLVHKWFNFYSUTIFVCWIRH3PJOMMLAZ5N44IU5ZODZ2LBVBY3IXKHQ2";

// Escrow wallet address for mock/simulation backing (can be any testnet account)
export const MOCK_ESCROW_ADDRESS = "GDNS7RJXWL2L2NTZ6TESPH6D4SPT3VAONOUGADO5BIC3QDOEHLJG2FNR";

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// Initialize StellarWalletsKit statically
StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: defaultModules(),
});

// Helper function to sign transactions through the kit
export async function signKitTransaction(xdr: string): Promise<string> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address,
    });
    return signedTxXdr;
  } catch (err: any) {
    console.error("Signature failed:", err);
    const errMsg = String(err?.message || err).toLowerCase();
    if (errMsg.includes("declined") || errMsg.includes("cancel") || errMsg.includes("reject") || errMsg.includes("user reject")) {
      throw new Error("USER_DECLINED");
    }
    if (errMsg.includes("not install") || errMsg.includes("missing")) {
      throw new Error("WALLET_NOT_INSTALLED");
    }
    throw err;
  }
}

// 1. Connect Kit wallet — returns public key
export async function connectWallet(): Promise<string> {
  try {
    const { address } = await StellarWalletsKit.authModal();
    if (!address) {
      throw new Error("WALLET_NOT_INSTALLED");
    }
    return address;
  } catch (err: any) {
    console.error("Wallet connection failed:", err);
    const errMsg = String(err?.message || err).toLowerCase();
    if (errMsg.includes("close") || errMsg.includes("cancel") || errMsg.includes("dismiss")) {
      throw new Error("CONNECTION_DISMISSED");
    }
    if (errMsg.includes("not install") || errMsg.includes("missing")) {
      throw new Error("WALLET_NOT_INSTALLED");
    }
    throw err;
  }
}

// 1.5 Disconnect Kit wallet
export async function disconnectWallet(): Promise<void> {
  await StellarWalletsKit.disconnect();
}

// 2. Get XLM + USDC balance for an address
export async function getBalance(publicKey: string): Promise<{ xlm: string; usdc: string }> {
  try {
    const account = await server.loadAccount(publicKey);
    let xlmList = "0.0000000";
    let usdcList = "0.0000000";
    
    for (const b of account.balances) {
      if (b.asset_type === "native") {
        xlmList = b.balance;
      } else if ("asset_code" in b && b.asset_code === "USDC") {
        usdcList = b.balance;
      }
    }
    return { xlm: xlmList, usdc: usdcList };
  } catch (error: any) {
    // Account doesn't exist yet on testnet if it is new
    if (error?.response?.status === 404) {
      return { xlm: "0.0000000", usdc: "0.0000000" };
    }
    console.error("Error in getBalance:", error);
    throw error;
  }
}

// 3. Send USDC from one address to another (simulates escrow deposit for demo)
export async function sendUSDC(fromKey: string, toKey: string, amount: number): Promise<string> {
  try {
    const account = await server.loadAccount(fromKey);
    
    // Check if USDC trustline exists and balance is sufficient
    let hasUsdc = false;
    let usdcBalance = 0;
    for (const b of account.balances) {
      if ("asset_code" in b && b.asset_code === "USDC") {
        hasUsdc = true;
        usdcBalance = parseFloat(b.balance);
      }
    }

    if (!hasUsdc) {
      throw new Error("NO_USDC_TRUSTLINE");
    }

    if (usdcBalance < amount) {
      throw new Error("INSUFFICIENT_USDC");
    }

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: toKey,
          asset: new StellarSdk.Asset(USDC_ASSET_CODE, USDC_ISSUER),
          amount: amount.toFixed(7),
        })
      )
      .setTimeout(60)
      .build();

    const signedTxXdr = await signKitTransaction(tx.toXDR());
    const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(txToSubmit);
    return result.hash;
  } catch (err: any) {
    console.error("Error sending USDC:", err);
    if (err.message === "NO_USDC_TRUSTLINE" || err.message === "INSUFFICIENT_USDC") {
      throw err;
    }
    
    // Handle Stellar result codes
    const resultResult = err?.response?.data?.extras?.result_codes;
    if (resultResult) {
      const opResults = resultResult.operations || [];
      if (opResults.includes("op_no_trust") || opResults.includes("op_src_no_trust")) {
        throw new Error("NO_USDC_TRUSTLINE");
      }
      if (opResults.includes("op_underfunded")) {
        throw new Error("INSUFFICIENT_USDC");
      }
      if (resultResult.transaction === "tx_bad_seq") {
        throw new Error("Bad sequence number. Please try again.");
      }
    }
    throw new Error(err?.message || "TRANSACTION_FAILED");
  }
}

// 3.5. Send native XLM from one address to another (gas fee gifting)
export async function sendXLM(fromKey: string, toKey: string, amount: number): Promise<string> {
  try {
    const account = await server.loadAccount(fromKey);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: toKey,
          asset: StellarSdk.Asset.native(),
          amount: amount.toFixed(7),
        })
      )
      .setTimeout(60)
      .build();

    const signedTxXdr = await signKitTransaction(tx.toXDR());
    const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(txToSubmit);
    return result.hash;
  } catch (err: any) {
    console.error("Error sending XLM:", err);
    throw new Error(err?.message || "XLM_TRANSFER_FAILED");
  }
}


// 4. Generate SHA-256 hash from a File object (for proof hashing)
export async function hashFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

// 5. Fetch last 10 transactions for an address from Horizon API
export async function getTransactionHistory(address: string): Promise<any[]> {
  if (address && address.startsWith("C")) {
    return [];
  }
  try {
    const history = await server.transactions()
      .forAccount(address)
      .order("desc")
      .limit(10)
      .call();
    return history.records || [];
  } catch (error) {
    console.warn("Could not retrieve transaction history:", error);
    return [];
  }
}

// 6. Add USDC trustline to an account
export async function addUSDCTrustline(publicKey: string): Promise<string> {
  try {
    const account = await server.loadAccount(publicKey);
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: new StellarSdk.Asset(USDC_ASSET_CODE, USDC_ISSUER),
        })
      )
      .setTimeout(60)
      .build();

    const signedTxXdr = await signKitTransaction(tx.toXDR());
    const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(txToSubmit);
    return result.hash;
  } catch (err: any) {
    console.error("Error creating trustline:", err);
    throw new Error(err?.message || "TRUSTLINE_FAILED");
  }
}

// Friendbot Helper for testnet XLM
export async function fundWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`);
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error funding account:", error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
//  SOROBAN SMART CONTRACT HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export function parseEnum(val: any): string {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    const keys = Object.keys(val);
    if (keys.length > 0) return keys[0];
  }
  return String(val);
}

export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
const rpcServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);

export async function queryContract(
  contractId: string,
  functionName: string,
  args: any[] = []
): Promise<any> {
  try {
    const contract = new StellarSdk.Contract(contractId);
    const tempSourceAddress = "GDNS7RJXWL2L2NTZ6TESPH6D4SPT3VAONOUGADO5BIC3QDOEHLJG2FNR";
    const sourceAccount = new StellarSdk.Account(tempSourceAddress, "0");
    
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(30)
      .build();

    const simulation = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
      if (simulation.result && simulation.result.retval) {
        return StellarSdk.scValToNative(simulation.result.retval);
      }
      return null;
    } else {
      console.error("Simulation failed:", simulation);
      throw new Error("SIMULATION_FAILED");
    }
  } catch (error) {
    console.error(`Error querying contract ${functionName}:`, error);
    throw error;
  }
}

export async function invokeContractFunction(
  userAddress: string,
  functionName: string,
  args: any[]
): Promise<string> {
  const account = await rpcServer.getAccount(userAddress);
  const contract = new StellarSdk.Contract(CONTRACT_ID);
  
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  // Prepare transaction (simulates and adds footprint/resources/fee)
  const preparedTx = await rpcServer.prepareTransaction(tx);

  // Request Kit signature
  const signedTxXdr = await signKitTransaction(preparedTx.toXDR());

  // Submit transaction
  const response = await rpcServer.sendTransaction(
    StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE)
  );

  if (response.status === "PENDING") {
    // Poll for status
    const pollResult = await rpcServer.pollTransaction(response.hash, {
      sleepStrategy: (attempt) => 1000,
      attempts: 12,
    });
    if (pollResult.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return response.hash;
    } else {
      throw new Error(`Transaction failed with status: ${pollResult.status}`);
    }
  } else {
    throw new Error(`Transaction submission failed: ${response.status}`);
  }
}

export async function initializeContract(
  adminAddress: string,
  studentAddress: string,
  amount: number
): Promise<string> {
  const tokenAddress = new StellarSdk.Asset(USDC_ASSET_CODE, USDC_ISSUER).contractId(NETWORK_PASSPHRASE);
  const amountStroops = BigInt(Math.round(amount * 10000000));
  
  const args = [
    StellarSdk.nativeToScVal(adminAddress, { type: "address" }),
    StellarSdk.nativeToScVal(studentAddress, { type: "address" }),
    StellarSdk.nativeToScVal(tokenAddress, { type: "address" }),
    StellarSdk.nativeToScVal(amountStroops, { type: "i128" }),
  ];
  
  return await invokeContractFunction(adminAddress, "initialize", args);
}

export async function depositContract(sponsorAddress: string): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(sponsorAddress, { type: "address" }),
  ];
  return await invokeContractFunction(sponsorAddress, "deposit", args);
}

export async function submitProofContract(
  studentAddress: string,
  proofHashHex: string
): Promise<string> {
  const bytes = hexToBytes(proofHashHex);
  const args = [
    StellarSdk.nativeToScVal(studentAddress, { type: "address" }),
    StellarSdk.nativeToScVal(bytes, { type: "bytes" }),
  ];
  return await invokeContractFunction(studentAddress, "submit_proof", args);
}

export async function releaseContract(adminAddress: string): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(adminAddress, { type: "address" }),
  ];
  return await invokeContractFunction(adminAddress, "release", args);
}

export async function refundContract(adminAddress: string): Promise<string> {
  const args = [
    StellarSdk.nativeToScVal(adminAddress, { type: "address" }),
  ];
  return await invokeContractFunction(adminAddress, "refund", args);
}

// 8. Fetch Soroban Events for the contract
export async function getContractEvents(startLedger?: number): Promise<any[]> {
  try {
    let start = startLedger;
    if (!start) {
      const latest = await rpcServer.getLatestLedger();
      start = Math.max(1, latest.sequence - 100);
    }
    const response = await rpcServer.getEvents({
      startLedger: start,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
        }
      ],
      limit: 10
    });
    return (response.events || []).map((e) => {
      try {
        const topics = (e.topic || []).map((t: any) => StellarSdk.scValToNative(t));
        const value = e.value ? StellarSdk.scValToNative(e.value) : null;
        return {
          id: e.id,
          ledger: e.ledger,
          topics,
          value,
        };
      } catch (err) {
        return {
          id: e.id,
          ledger: e.ledger,
          topics: [],
          value: null,
        };
      }
    });
  } catch (error) {
    console.warn("Could not retrieve contract events from RPC:", error);
    return [];
  }
}
