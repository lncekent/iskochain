import * as StellarSdk from "@stellar/stellar-sdk";

const kp = StellarSdk.Keypair.random();
console.log("Valid public key:", kp.publicKey());
