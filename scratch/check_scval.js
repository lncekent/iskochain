import * as StellarSdk from "@stellar/stellar-sdk";

try {
  const gAddress = "GAE2GDREOKEDNKKJ7V7ZLQHVCSCYJ3PDWFRFOCMRE6KUMXGUP6YUKTTH";
  const scVal = StellarSdk.nativeToScVal(gAddress, { type: "address" });
  console.log("Converted to ScVal:", scVal);
  
  const decoded = StellarSdk.scValToNative(scVal);
  console.log("Decoded back to native:", decoded);
  console.log("Type of decoded:", typeof decoded);
} catch (e) {
  console.error("Error caught:", e);
}
