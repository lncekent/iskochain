import * as StellarSdk from "@stellar/stellar-sdk";

const gAddress = "GAE2GDREOKEDNKKJ7V7ZLQHVCSCYJ3PDWFRFOCMRE6KUMXGUP6YUKTTH";
console.log("Is valid G address via StrKey:", StellarSdk.StrKey.isValidEd25519PublicKey(gAddress));
try {
  const kp = StellarSdk.Keypair.fromPublicKey(gAddress);
  console.log("Keypair.fromPublicKey success:", kp.publicKey());
} catch (e) {
  console.error("Keypair.fromPublicKey failed:", e.message);
}
try {
  const address = new StellarSdk.Address(gAddress);
  console.log("new Address success");
} catch (e) {
  console.error("new Address failed:", e.message);
}
