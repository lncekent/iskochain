#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, BytesN, Env,
    token::Client as TokenClient,
};

// ─────────────────────────────────────────────────────────────
//  STORAGE KEYS
//  Each key maps to one piece of persistent state on-chain.
// ─────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Admin,       // Address of the scholarship administrator (LGU / foundation)
    Student,     // Address of the verified scholarship recipient
    Sponsor,     // Address of the fund depositor
    Token,       // USDC token contract address on Stellar
    Amount,      // Scholarship amount (in stroops — 7 decimal places)
    Status,      // Current lifecycle state of this escrow
    ProofHash,   // SHA-256 hash of the student's enrollment document
}

// ─────────────────────────────────────────────────────────────
//  ESCROW STATUS LIFECYCLE
//
//  Pending → Funded → ProofSubmitted → Released
//                   ↘ Refunded  (admin can refund from Funded or ProofSubmitted)
// ─────────────────────────────────────────────────────────────
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum Status {
    Pending,        // Contract initialized, waiting for sponsor deposit
    Funded,         // Sponsor deposited USDC — funds locked in contract
    ProofSubmitted, // Student uploaded enrollment proof — awaiting admin approval
    Released,       // Admin approved — USDC sent to student wallet ✅
    Refunded,       // Admin returned funds to sponsor (e.g. student withdrew)
}

// ─────────────────────────────────────────────────────────────
//  CONTRACT DEFINITION
//  IskoChain — Conditional scholarship escrow for QC scholars
//  "Isko" = Filipino slang for "Iskolar ng Bayan" (Scholar of the Nation)
// ─────────────────────────────────────────────────────────────
#[contract]
pub struct IskoChain;

#[contractimpl]
impl IskoChain {

    // ── INITIALIZE ────────────────────────────────────────────
    // Sets up a new scholarship escrow. Called once by admin.
    // Defines who the student is, what token to use, and how much.
    pub fn initialize(
        env: Env,
        admin: Address,
        student: Address,
        token: Address,
        amount: i128,
    ) {
        // Prevent double initialization
        if env.storage().instance().has(&DataKey::Status) {
            panic!("already initialized");
        }
        if amount <= 0 {
            panic!("amount must be greater than zero");
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin,   &admin);
        env.storage().instance().set(&DataKey::Student, &student);
        env.storage().instance().set(&DataKey::Token,   &token);
        env.storage().instance().set(&DataKey::Amount,  &amount);
        env.storage().instance().set(&DataKey::Status,  &Status::Pending);
    }

    // ── DEPOSIT ───────────────────────────────────────────────
    // QCYDO (or a sponsor/OFW/NGO) locks USDC into the contract.
    // Stellar transfers the approved scholarship amount (≈175 USDC / ₱10,000)
    // from the depositor's wallet to the contract address.
    // Status: Pending → Funded
    pub fn deposit(env: Env, sponsor: Address) {
        sponsor.require_auth();

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Status::Pending {
            panic!("deposit not allowed in current state");
        }

        let token:  Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128    = env.storage().instance().get(&DataKey::Amount).unwrap();

        // Transfer USDC: sponsor → contract (escrow lock)
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&sponsor, &env.current_contract_address(), &amount);

        env.storage().instance().set(&DataKey::Sponsor, &sponsor);
        env.storage().instance().set(&DataKey::Status,  &Status::Funded);
    }

    // ── SUBMIT PROOF ──────────────────────────────────────────
    // Scholar submits a SHA-256 hash of their Certificate of Registration (COR).
    // The actual document is NOT stored on-chain — only its hash.
    // This makes the proof tamper-proof and privacy-respecting.
    // Status: Funded → ProofSubmitted
    pub fn submit_proof(env: Env, student: Address, proof_hash: BytesN<32>) {
        student.require_auth();

        // Only the registered student can submit proof
        let registered_student: Address = env.storage().instance().get(&DataKey::Student).unwrap();
        if student != registered_student {
            panic!("unauthorized: not the registered student");
        }

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Status::Funded {
            panic!("contract not funded yet");
        }

        // Store the hash on-chain — permanent, tamper-proof record
        env.storage().instance().set(&DataKey::ProofHash, &proof_hash);
        env.storage().instance().set(&DataKey::Status,    &Status::ProofSubmitted);
    }

    // ── RELEASE ───────────────────────────────────────────────
    // Admin verifies the submitted proof off-chain, then calls this
    // to release funds. Stellar transfers USDC from contract → student.
    // Status: ProofSubmitted → Released
    pub fn release(env: Env, admin: Address) {
        admin.require_auth();

        let registered_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != registered_admin {
            panic!("unauthorized: not the admin");
        }

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Status::ProofSubmitted {
            panic!("proof not submitted yet");
        }

        let token:   Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount:  i128    = env.storage().instance().get(&DataKey::Amount).unwrap();
        let student: Address = env.storage().instance().get(&DataKey::Student).unwrap();

        // 💸 The key moment: USDC flows from contract → student wallet
        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &student, &amount);

        env.storage().instance().set(&DataKey::Status, &Status::Released);
    }

    // ── REFUND ────────────────────────────────────────────────
    // Admin returns funds to sponsor if the scholarship is cancelled.
    // Can be called from Funded or ProofSubmitted states.
    pub fn refund(env: Env, admin: Address) {
        admin.require_auth();

        let registered_admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if admin != registered_admin {
            panic!("unauthorized: not the admin");
        }

        let status: Status = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Status::Funded && status != Status::ProofSubmitted {
            panic!("cannot refund in current state");
        }

        let token:   Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount:  i128    = env.storage().instance().get(&DataKey::Amount).unwrap();
        let sponsor: Address = env.storage().instance().get(&DataKey::Sponsor).unwrap();

        let token_client = TokenClient::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &sponsor, &amount);

        env.storage().instance().set(&DataKey::Status, &Status::Refunded);
    }

    // ── READ-ONLY QUERIES (called by the React frontend) ─────

    pub fn get_status(env: Env) -> Status {
        env.storage().instance().get(&DataKey::Status).unwrap()
    }

    pub fn get_amount(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Amount).unwrap()
    }

    pub fn get_student(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Student).unwrap()
    }

    pub fn get_proof_hash(env: Env) -> BytesN<32> {
        env.storage().instance().get(&DataKey::ProofHash)
            .unwrap_or_else(|| panic!("no proof submitted yet"))
    }
}

// Link to the separate test file — Rust picks this up automatically
#[cfg(test)]
mod test;