import * as StellarSdk from "@stellar/stellar-sdk";

const USDC_ASSET_CODE = "USDC";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

try {
  const asset = new StellarSdk.Asset(USDC_ASSET_CODE, USDC_ISSUER);
  console.log("Asset created successfully:", asset.toString());
  
  const contractId = asset.contractId(NETWORK_PASSPHRASE);
  console.log("Contract ID derived:", contractId);
  console.log("Type of contractId:", typeof contractId);

  const scVal = StellarSdk.nativeToScVal(contractId, { type: "address" });
  console.log("ScVal converted successfully:", JSON.stringify(scVal));
} catch (e) {
  console.error("Error caught:", e);
}
