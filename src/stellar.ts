import * as StellarSdk from "@stellar/stellar-sdk";
import freighterApi from "@stellar/freighter-api";

export const NETWORK = "TESTNET";
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

// USDC on Stellar Testnet
export const USDC_ASSET_CODE = "USDC";
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
export const CONTRACT_ID = "YOUR_CONTRACT_ID_HERE";

// Escrow wallet address for mock/simulation backing (can be any testnet account)
export const MOCK_ESCROW_ADDRESS = "GBQLX6K3LHY3MXR7G7SCDWS43DQXAQA6NDD2G77XCSYEXYJ7PZPHXNCS";

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// Cast freighterApi module to any to bypass strict type declarations while keeping fully dynamic runtime support
const api: any = freighterApi;

// helper to safely extract getPublicKey function with double fallback
const getFreighterPublicKey = async (): Promise<string> => {
  if (api && typeof api.getPublicKey === "function") {
    return await api.getPublicKey();
  }
  if (api && typeof api.getAddress === "function") {
    const res = await api.getAddress();
    return res.address;
  }
  throw new Error("getPublicKey method not found on Freighter API");
};

// helper to safely extract isConnected function with double fallback
const checkFreighterConnected = async (): Promise<boolean> => {
  if (api && typeof api.isConnected === "function") {
    const res = await api.isConnected();
    return typeof res === "object" ? !!res.isConnected : !!res;
  }
  return false;
};

// helper to safely extract signTransaction function
const signFreighterTransaction = async (xdr: string, options: any): Promise<any> => {
  if (api && typeof api.signTransaction === "function") {
    return await api.signTransaction(xdr, options);
  }
  throw new Error("signTransaction method not found on Freighter API");
};

// 1. Connect Freighter wallet — returns public key
export async function connectWallet(): Promise<string> {
  const connected = await checkFreighterConnected();
  if (!connected) {
    throw new Error("Freighter wallet not installed");
  }
  const publicKey = await getFreighterPublicKey();
  if (!publicKey) {
    throw new Error("Freighter wallet locked or access denied");
  }
  return publicKey;
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

    const resultResponse = await signFreighterTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    const signedTxXdr = resultResponse.signedTxXdr || resultResponse;

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

    const resultResponse = await signFreighterTransaction(tx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    const signedTxXdr = resultResponse.signedTxXdr || resultResponse;

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
