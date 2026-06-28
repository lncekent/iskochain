# IskoChain 🎓

> Conditional scholarship disbursement on Stellar — so no QC scholar ever waits 3 months for an approved grant again.

[![Built on Stellar](https://img.shields.io/badge/Built%20on-Stellar-7B2FBE?style=flat-square)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Smart%20Contract-Soroban-black?style=flat-square)](https://soroban.stellar.org)
[![Network](https://img.shields.io/badge/Network-Testnet-orange?style=flat-square)](https://stellar.expert/explorer/testnet)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

---

## 📌 Table of Contents

1. [The Problem](#-the-problem)
2. [The Solution](#-the-solution)
3. [Why Stellar?](#-why-stellar)
4. [Stellar Features Used](#-stellar-features-used)
5. [Target Users](#-target-users)
6. [Demo Flow (MVP)](#-demo-flow-mvp)
7. [Vision & Purpose](#-vision--purpose)
8. [Project Structure](#-project-structure)
9. [Prerequisites](#-prerequisites)
10. [Getting Started](#-getting-started)
11. [Build the Contract](#-build-the-contract)
12. [Run the Tests](#-run-the-tests)
13. [Deploy to Testnet](#-deploy-to-testnet)
14. [Sample CLI Invocations](#-sample-cli-invocations)
15. [Timeline](#-timeline)
16. [License](#-license)

---

<img width="1321" height="656" alt="image" src="https://github.com/user-attachments/assets/ed3158f4-3f8a-4578-a2aa-e8261843ece6" />


> Contract ID: CBTLVHKWFNFYSUTIFVCWIRH3PJOMMLAZ5N44IU5ZODZ2LBVBY3IXKHQ2

> Demo Link:  [Click Here](https://iskochain.vercel.app/)

> Demo Video Link: [Click Here](https://res.cloudinary.com/dxatb3m2q/video/upload/v1782648850/Screen_Recording_2026-06-28_201201_f7wh2g.mp4)

> TX: [3b9c08502ecee1f7973013932cb6dff837755121cb6ba25ad84a444a210b84ae](https://stellar.expert/explorer/testnet/tx/3b9c08502ecee1f7973013932cb6dff837755121cb6ba25ad84a444a210b84ae)

> Screenshots: [GDrive](https://drive.google.com/drive/folders/1c762WdIyunkrePaI80lpfx49hFbsXJ_t?usp=drive_link)


## 🔴 The Problem

Every semester, **18,000 scholars** enrolled in the QCYDO Scholarship Program (Quezon City Youth Development Office) face the same experience: their grant is approved, but the money doesn't come for 2–3 months.

This isn't because the government is negligent. It's a **scalability problem**:

- QCYDO must manually coordinate disbursement across hundreds of partner schools
- Schools submit billing documents late or with errors
- A single missing form from one school stalls the entire batch
- Scholars borrow money, skip meals, and sometimes drop out — while waiting for a grant that was already approved

> 📰 In March 2026, a Quezon City councilor publicly denounced this situation, calling delays in the QCYDO stipend program "deeply alarming." The problem is systemic, not seasonal.

**The cost of this friction:** A scholar who drops out due to a delayed stipend loses not just ₱10,000 — they lose a semester, potentially their degree, and years of future earning potential.

---

## ✅ The Solution

IskoChain puts the approved scholarship amount **on-chain the moment it is granted** — locked in a Soroban smart contract that no one can touch until the student submits their Certificate of Registration (COR).

```
QCYDO approves scholar
        ↓
Funds locked in Soroban escrow contract (publicly visible)
        ↓
Scholar uploads COR → SHA-256 hash stored on Stellar
        ↓
Admin verifies → release() called
        ↓
USDC in scholar's wallet in < 5 seconds ✅
```

No paper forms. No batch processing. No budget excuses. Every peso publicly accountable.

---

## ⚡ Why Stellar?

| Need | Why Stellar delivers |
|------|----------------------|
| **Speed** | Sub-5 second settlement — vs 2–3 month manual process |
| **Cost** | Near-zero fees — viable for ₱10,000 micro-disbursements at scale |
| **Transparency** | Every transaction on the public ledger — no "nawala sa budget" |
| **Trust** | Funds locked on-chain at approval — cannot be silently reallocated |
| **Scale** | 18,000 simultaneous disbursements — no bottleneck |

No other blockchain makes micro-scholarship disbursement economically viable at this scale.

---

## 🌟 Stellar Features Used

| Feature | How IskoChain uses it |
|---------|----------------------|
| **USDC transfers** | Scholarship funds move on-chain in USDC (≈ ₱10,000 per scholar) |
| **Soroban smart contracts** | Conditional escrow: funds lock on approval, release on proof |
| **Trustlines** | Scholar wallet establishes USDC trustline to receive disbursement |
| **Public ledger** | Every deposit and release is publicly verifiable on Stellar Explorer |

---

## 👥 Target Users

| Role | Who | Where | Why they care |
|------|-----|--------|---------------|
| **Scholar** | College student, 18–24, QCitizen, enrolled in QCYDO program | Quezon City, NCR | Receives stipend in seconds instead of months |
| **Sponsor / QCYDO** | LGU treasurer, OFW parent, private foundation | QC government offices | Funds are locked publicly — full accountability, zero leakage |
| **Admin** | QCYDO scholarship coordinator | University scholarship office | One-click release replaces weeks of document chasing |
| **Public** | Any taxpayer, auditor, NGO | Anywhere | Can verify every disbursement on Stellar Explorer — no FOI needed |

---

## 🎬 Demo Flow (MVP)

> Complete end-to-end flow, demo-able in under 2 minutes.

**Step 1 — Admin initializes escrow**
```
QCYDO coordinator enters scholar wallet address + amount (175 USDC ≈ ₱10,000)
→ Soroban contract deployed with scholar registered
→ Status: Pending
```

**Step 2 — Funds locked on-chain**
```
QCYDO (or sponsor) deposits 175 USDC
→ Funds locked in contract — publicly visible on Stellar Explorer
→ Status: Funded
```

**Step 3 — Scholar submits proof**
```
Scholar uploads Certificate of Registration (COR) photo
→ App generates SHA-256 hash of the document
→ Hash stored permanently on Stellar (not the document itself)
→ Status: ProofSubmitted
```

**Step 4 — Release**
```
Admin clicks "Release Funds"
→ Soroban contract transfers 175 USDC → scholar's wallet
→ Transaction confirmed in < 5 seconds
→ Status: Released ✅
```

**Step 5 — Transparency**
```
Any member of the public opens the Transparency Feed
→ Sees every deposit, every release, every wallet address
→ Live from Stellar Horizon API
```

---

## 🔭 Vision & Purpose

IskoChain does not replace QCYDO. It gives QCYDO a **transparent disbursement rail** that scales to 18,000 scholars without adding 18,000 manual steps.

**Short term:** Pilot with a single QC scholarship batch. Demonstrate that on-chain disbursement is faster, cheaper, and more transparent than the current process.

**Medium term:** Offer IskoChain as open infrastructure to any LGU, private foundation, or NGO running a scholarship program in the Philippines. One codebase, deployed by any institution.

**Long term:** Become the standard scholarship disbursement layer across the Philippines — with a public audit trail that any taxpayer, donor, or NGO can verify without filing a Freedom of Information request.

> "Every peso that goes to a scholar should be traceable from the moment it is promised to the moment it arrives. IskoChain makes that the default, not the exception."

---

## 📁 Project Structure

```
iskochain/
├── src/
│   ├── lib.rs          ← Soroban smart contract (escrow logic)
│   └── test.rs         ← 5 tests (happy path, edge cases, state verification)
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Main app with tab navigation
│   │   ├── stellar.js           ← Stellar SDK integration layer
│   │   └── components/
│   │       ├── Navbar.jsx           ← Wallet connect header
│   │       ├── AdminView.jsx        ← QCYDO: initialize + release
│   │       ├── SponsorView.jsx      ← Deposit USDC into escrow
│   │       ├── StudentView.jsx      ← Submit COR proof, receive funds
│   │       └── TransparencyFeed.jsx ← Public ledger dashboard
│   └── package.json
├── Cargo.toml
└── README.md
```

---

## 🛠️ Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Rust** | stable (≥ 1.74) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| **Wasm target** | — | `rustup target add wasm32-unknown-unknown` |
| **Stellar CLI** | ≥ 21.0.0 | `cargo install --locked stellar-cli --features opt` |
| **Node.js** | ≥ 18 | [nodejs.org](https://nodejs.org) |
| **Freighter Wallet** | latest | [freighter.app](https://freighter.app) *(browser extension)* |

Verify your setup:
```bash
rustc --version        # rustc 1.74.0 or higher
stellar --version      # stellar 21.x.x or higher
node --version         # v18.x.x or higher
```

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/iskochain
cd iskochain

# 2. Run the frontend
cd frontend
npm install
npm run dev
# → Open http://localhost:5173
```

---

## 🔨 Build the Contract

```bash
# From the project root
stellar contract build

# Output:
# target/wasm32-unknown-unknown/release/iskochain.wasm
```

Confirm the build succeeded:
```bash
ls -lh target/wasm32-unknown-unknown/release/iskochain.wasm
# Should be < 100KB (Wasm-optimized)
```

---

## 🧪 Run the Tests

```bash
cargo test
```

Expected output:
```
running 5 tests
test tests::test_full_scholarship_flow .............. ok
test tests::test_impostor_student_is_rejected ....... ok
test tests::test_storage_state_after_deposit ........ ok
test tests::test_double_deposit_is_rejected ......... ok
test tests::test_admin_refund_returns_funds_to_sponsor ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured
```

| Test | What it verifies |
|------|-----------------|
| `test_full_scholarship_flow` | Happy path — full initialize → deposit → proof → release cycle |
| `test_impostor_student_is_rejected` | A fake student cannot claim another scholar's funds |
| `test_storage_state_after_deposit` | On-chain storage reflects correct state and balances after deposit |
| `test_double_deposit_is_rejected` | Sponsor cannot accidentally deposit twice into the same escrow |
| `test_admin_refund_returns_funds_to_sponsor` | Admin can cancel and return full amount to sponsor |

---

## 🌐 Deploy to Testnet

### Step 1 — Create and fund testnet wallets

```bash
# Generate wallets for each role
stellar keys generate admin   --network testnet
stellar keys generate scholar --network testnet
stellar keys generate sponsor --network testnet

# Fund all wallets with free testnet XLM via Friendbot
stellar keys fund admin   --network testnet
stellar keys fund scholar --network testnet
stellar keys fund sponsor --network testnet

# View your wallet addresses
stellar keys address admin
stellar keys address scholar
stellar keys address sponsor
```

### Step 2 — Deploy the contract

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/iskochain.wasm \
  --source admin \
  --network testnet

# Output: CONTRACT_ID (save this — you'll need it for all invocations)
# Example: CBIELTK6AQTEB347URM5EPJBKLP4ZTOLFD2YBC4L7Q56KED5KM3MZSXF
```

### Step 3 — Add USDC trustline for the scholar wallet

```bash
stellar contract invoke \
  --id GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 \
  --source scholar \
  --network testnet \
  -- change_trust \
  --line '{"code":"USDC","issuer":"GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"}' \
  --limit "1000"
```

---

## 📡 Sample CLI Invocations

Replace `<CONTRACT_ID>` with your deployed contract address.

---

### 1. Initialize the scholarship escrow

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin) \
  --student $(stellar keys address scholar) \
  --token GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5 \
  --amount 1750000000
```
> `1750000000` = 175 USDC (Stellar uses 7 decimal places: 175 × 10,000,000)

---

### 2. Sponsor deposits funds

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source sponsor \
  --network testnet \
  -- deposit \
  --sponsor $(stellar keys address sponsor)
```

---

### 3. Scholar submits enrollment proof (COR hash)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source scholar \
  --network testnet \
  -- submit_proof \
  --student $(stellar keys address scholar) \
  --proof_hash "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
```
> The `proof_hash` is the SHA-256 of the scholar's uploaded Certificate of Registration.

---

### 4. Admin releases funds to scholar

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- release \
  --admin $(stellar keys address admin)
```

---

### 5. Check current escrow status

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- get_status
# Output: "ProofSubmitted" | "Funded" | "Released" | "Pending" | "Refunded"
```

---

### 6. Admin refunds sponsor (if scholarship is cancelled)

```bash
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- refund \
  --admin $(stellar keys address admin)
```

---

### 7. Verify on Stellar Explorer

After any transaction, view it publicly at:
```
https://stellar.expert/explorer/testnet/contract/<CONTRACT_ID>
```

---

## 📅 Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Concept & Architecture** | Hour 0–1 | Problem definition, Stellar feature selection, system design |
| **Smart Contract** | Hour 1–3 | `lib.rs` (IskoChain contract), `test.rs` (5 tests), `Cargo.toml` |
| **Frontend** | Hour 3–6 | React app — Admin, Sponsor, Scholar, Transparency views |
| **Integration** | Hour 6–7 | Stellar SDK wired to contract, Freighter wallet, Horizon live feed |
| **Deploy & Polish** | Hour 7–8 | Testnet deploy, Vercel hosting, demo run-through |

---

## ⚙️ CI/CD Pipeline & Production Architecture

### 1. Continuous Integration (GitHub Actions)
The repository is protected by a GitHub Actions workflow defined in [.github/workflows/stellar.yml](file:///.github/workflows/stellar.yml). On every push or pull request to the `main` branch, the runner:
1. Installs the Rust toolchain with the `wasm32-unknown-unknown` target.
2. Caches Cargo dependencies to optimize build times.
3. Runs the Rust unit test suite (`cargo test`) verifying the 5 smart contract scenarios.
4. Installs Node.js dependencies and runs the TypeScript compiler check (`npm run lint`).

### 2. Multi-Wallet Architecture (`StellarWalletsKit`)
We integrated `@creit.tech/stellar-wallets-kit` to allow seamless interaction between different roles using diverse wallets (Freighter, Albedo, Hana, xBull, Lobstr). This enables:
- Seamless switching between government LGU wallets, NGO donor wallets, and student wallets.
- Robust user-facing error mapping for signature rejections (`USER_DECLINED`), missing extensions (`WALLET_NOT_INSTALLED`), and connection exits.

### 3. Real-Time Event Syncing
Our Transparency Feed queries the Soroban RPC server's `getEvents` endpoint in real-time, parsing transaction topics and parameters dynamically. Any on-chain event (e.g., `deposit`, `proof`, `release`) is instantly displayed at the top of the feed as a verified ledger transaction, providing a fully transparent audit trail.

---

## 📜 License

```
MIT License

Copyright (c) 2026 IskoChain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

---

<div align="center">
  <p>Built with 🤍 for 18,000 QC scholars who deserve better.</p>
  <p>
    <a href="https://stellar.org">Stellar</a> •
    <a href="https://soroban.stellar.org">Soroban</a> •
    <a href="https://qcydo.gov.ph">QCYDO</a> •
    <a href="https://stellar.expert/explorer/testnet">Stellar Explorer</a>
  </p>
</div>
