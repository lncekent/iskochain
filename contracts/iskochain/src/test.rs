// ─────────────────────────────────────────────────────────────
//  ISKOCHAIN — TEST SUITE
//  Conditional scholarship disbursement on Stellar
//  Quezon City, Philippines — QCYDO Scholar Program
//
//  Exactly 5 tests as required by the hackathon specification.
//  All tests use soroban_sdk::testutils and Env::default().
// ─────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use crate::{IskoChain, IskoChainClient, Status};
    use soroban_sdk::{
        testutils::Address as _,
        Address, BytesN, Env,
        token::{Client as TokenClient, StellarAssetClient},
    };

    // ── Shared setup helper ───────────────────────────────────
    // Returns: (env, admin, sponsor, student, token_address, amount)
    // Mints USDC to the sponsor so they can fund the escrow.
    fn setup() -> (Env, Address, Address, Address, Address, i128) {
        let env = Env::default();
        env.mock_all_auths(); // Bypass auth checks — not what we're testing here

        let admin   = Address::generate(&env);
        let sponsor = Address::generate(&env);
        let student = Address::generate(&env);

        // Register a mock USDC Stellar asset contract
        let token_admin = Address::generate(&env);
        let token = env
            .register_stellar_asset_contract_v2(token_admin.clone())
            .address();

        // 175 USDC ≈ ₱10,000 — the standard QCYDO scholar stipend
        // Stellar uses 7 decimal places: 175 * 10_000_000 = 1_750_000_000
        let amount: i128 = 1_750_000_000;

        // Mint USDC to sponsor wallet
        let stellar_asset = StellarAssetClient::new(&env, &token);
        stellar_asset.mint(&sponsor, &amount);

        (env, admin, sponsor, student, token, amount)
    }

    // ─────────────────────────────────────────────────────────
    //  TEST 1 — HAPPY PATH
    //  The full MVP transaction executes successfully end-to-end.
    //  initialize → deposit → submit_proof → release
    //  Asserts student wallet receives USDC at the end.
    // ─────────────────────────────────────────────────────────
    #[test]
    fn test_full_scholarship_flow() {
        let (env, admin, sponsor, student, token, amount) = setup();
        let contract_id = env.register_contract(None, IskoChain);
        let client = IskoChainClient::new(&env, &contract_id);

        // Step 1: Admin sets up the scholarship escrow
        client.initialize(&admin, &student, &token, &amount);
        assert_eq!(client.get_status(), Status::Pending);

        // Step 2: Sponsor locks USDC into the contract
        client.deposit(&sponsor);
        assert_eq!(client.get_status(), Status::Funded);

        // Step 3: Student submits SHA-256 hash of their enrollment doc
        let proof_hash = BytesN::from_array(&env, &[1u8; 32]);
        client.submit_proof(&student, &proof_hash);
        assert_eq!(client.get_status(), Status::ProofSubmitted);

        // Step 4: Admin approves — USDC released to student instantly
        client.release(&admin);
        assert_eq!(client.get_status(), Status::Released);

        // ✅ Student wallet now holds the full scholarship amount
        let token_client = TokenClient::new(&env, &token);
        assert_eq!(token_client.balance(&student), amount);
        assert_eq!(token_client.balance(&contract_id), 0);
    }

    // ─────────────────────────────────────────────────────────
    //  TEST 2 — EDGE CASE (FAILURE SCENARIO)
    //  An impostor tries to submit proof for a scholarship that
    //  belongs to a different student. Must be rejected.
    // ─────────────────────────────────────────────────────────
    #[test]
    #[should_panic(expected = "unauthorized: not the registered student")]
    fn test_impostor_student_is_rejected() {
        let (env, admin, sponsor, student, token, amount) = setup();
        let contract_id = env.register_contract(None, IskoChain);
        let client = IskoChainClient::new(&env, &contract_id);

        client.initialize(&admin, &student, &token, &amount);
        client.deposit(&sponsor);

        // A different wallet tries to claim this scholarship — must fail
        let impostor   = Address::generate(&env);
        let fake_proof = BytesN::from_array(&env, &[9u8; 32]);
        client.submit_proof(&impostor, &fake_proof); // ← panics here ✅
    }

    // ─────────────────────────────────────────────────────────
    //  TEST 3 — STATE VERIFICATION
    //  After the sponsor deposits, assert that on-chain storage
    //  reflects the correct state: status = Funded, amount stored,
    //  student address stored, and contract holds the USDC.
    // ─────────────────────────────────────────────────────────
    #[test]
    fn test_storage_state_after_deposit() {
        let (env, admin, sponsor, student, token, amount) = setup();
        let contract_id = env.register_contract(None, IskoChain);
        let client = IskoChainClient::new(&env, &contract_id);

        client.initialize(&admin, &student, &token, &amount);
        client.deposit(&sponsor);

        // ── Contract storage must reflect correct values ──────
        assert_eq!(client.get_status(),  Status::Funded);  // status updated
        assert_eq!(client.get_amount(),  amount);           // amount recorded
        assert_eq!(client.get_student(), student);          // student registered

        // ── Token balances must be correct ───────────────────
        let token_client = TokenClient::new(&env, &token);
        assert_eq!(token_client.balance(&contract_id), amount); // contract holds USDC
        assert_eq!(token_client.balance(&sponsor),     0);      // sponsor gave it all
    }

    // ─────────────────────────────────────────────────────────
    //  TEST 4 — EDGE CASE: DOUBLE DEPOSIT
    //  Once the escrow is Funded, a second deposit must fail.
    //  This prevents sponsors from accidentally depositing twice.
    // ─────────────────────────────────────────────────────────
    #[test]
    #[should_panic(expected = "deposit not allowed in current state")]
    fn test_double_deposit_is_rejected() {
        let (env, admin, sponsor, student, token, amount) = setup();

        // Give sponsor extra tokens to attempt a second deposit
        let stellar_asset = StellarAssetClient::new(&env, &token);
        stellar_asset.mint(&sponsor, &amount);

        let contract_id = env.register_contract(None, IskoChain);
        let client = IskoChainClient::new(&env, &contract_id);

        client.initialize(&admin, &student, &token, &amount);
        client.deposit(&sponsor);     // ← first deposit: OK
        client.deposit(&sponsor);     // ← second deposit: must panic ✅
    }

    // ─────────────────────────────────────────────────────────
    //  TEST 5 — REFUND PATH
    //  Admin cancels the scholarship and returns funds to sponsor.
    //  Verifies sponsor gets full amount back and contract is empty.
    // ─────────────────────────────────────────────────────────
    #[test]
    fn test_admin_refund_returns_funds_to_sponsor() {
        let (env, admin, sponsor, student, token, amount) = setup();
        let contract_id = env.register_contract(None, IskoChain);
        let client = IskoChainClient::new(&env, &contract_id);

        client.initialize(&admin, &student, &token, &amount);
        client.deposit(&sponsor);
        assert_eq!(client.get_status(), Status::Funded);

        // Admin cancels — e.g., student failed retention requirement
        client.refund(&admin);
        assert_eq!(client.get_status(), Status::Refunded);

        // ✅ Sponsor gets their USDC back in full
        let token_client = TokenClient::new(&env, &token);
        assert_eq!(token_client.balance(&sponsor),     amount); // sponsor refunded
        assert_eq!(token_client.balance(&contract_id), 0);      // contract empty
    }
}