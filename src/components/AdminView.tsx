import React, { useState } from "react";
import { Shield, Coins, Calendar, GraduationCap, Building, AlertTriangle, CheckCircle2, ArrowRight, Save } from "lucide-react";

interface AdminViewProps {
  walletAddress: string | null;
  escrowStatus: "Pending" | "Funded" | "ProofSubmitted" | "Released" | "Refunded";
  setEscrowStatus: (status: "Pending" | "Funded" | "ProofSubmitted" | "Released" | "Refunded") => void;
  scholarshipAmount: number;
  setScholarshipAmount: (amount: number) => void;
  studentAddress: string;
  setStudentAddress: (address: string) => void;
  scholarName: string;
  setScholarName: (name: string) => void;
  schoolName: string;
  setSchoolName: (name: string) => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminView({
  walletAddress,
  escrowStatus,
  setEscrowStatus,
  scholarshipAmount,
  setScholarshipAmount,
  studentAddress,
  setStudentAddress,
  scholarName,
  setScholarName,
  schoolName,
  setSchoolName,
  addToast,
}: AdminViewProps) {
  // Local form inputs
  const [localStudentAddr, setLocalStudentAddr] = useState(studentAddress);
  const [localAmount, setLocalAmount] = useState(scholarshipAmount.toString());
  const [localSemester, setLocalSemester] = useState("1st Semester 2025–2026");
  const [localScholarName, setLocalScholarName] = useState(scholarName);
  const [localSchool, setLocalSchool] = useState(schoolName);

  const [isInitializing, setIsInitializing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);

  // Quick action: Pre-fill demo data
  const loadDemoData = () => {
    setLocalScholarName("Maria Santos");
    setLocalSchool("Quezon City University");
    setLocalStudentAddr("GAE2GDREOKEDNKKJ7V7ZLQHVCSCYJ3PDWFRFOCMRE6KUMXGUP6YUKTTH");
    setLocalAmount("175");
    addToast("Loaded Maria Santos demo profile", "info");
  };

  const handleInitialize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      addToast("Please connect your Freighter wallet to perform administrative actions.", "error");
      return;
    }
    if (!localStudentAddr.startsWith("G") || localStudentAddr.length !== 56) {
      addToast("Invalid Stellar G-address length or format.", "error");
      return;
    }
    if (parseFloat(localAmount) <= 0) {
      addToast("Scholarship amount must be greater than 0.", "error");
      return;
    }

    setIsInitializing(true);
    addToast("Initializing Soroban Escrow Contract on Stellar Testnet...", "info");

    // Artificial wait of 1.5 seconds to simulate real blockchain transaction
    setTimeout(() => {
      setStudentAddress(localStudentAddr);
      setScholarshipAmount(parseFloat(localAmount));
      setScholarName(localScholarName || "Maria Santos");
      setSchoolName(localSchool || "Quezon City University");
      setEscrowStatus("Pending");
      setIsInitializing(false);
      addToast("✓ Stellar smart contract initialized! Awaiting Sponsor funding.", "success");
    }, 1600);
  };

  const handleReleaseFunds = () => {
    if (!walletAddress) {
      addToast("Please connect your administrative wallet.", "error");
      return;
    }
    setIsReleasing(true);
    addToast("Broadcasting cryptographic release signal to Stellar blockchain...", "info");

    setTimeout(() => {
      setEscrowStatus("Released");
      setIsReleasing(false);
      addToast("🎉 Funds unlocked! 175 USDC successfully disbursed directly to Student.", "success");
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Banner info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-50 rounded-xl text-[#1B4FD8]">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">QCYDO Administrative Dashboard</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
              Securely deploy conditional escrow deposits. Funds stay locked on Stellar until verified proof is submitted.
            </p>
          </div>
        </div>
        <button
          onClick={loadDemoData}
          className="text-xs font-bold text-[#1B4FD8] bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all whitespace-nowrap shrink-0"
        >
          ⚡ Load Maria Santos Demo Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION A: Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200/60 pb-3 flex items-center gap-2">
              <Coins className="h-5 w-5 text-[#1B4FD8]" />
              Initialize Scholarship Escrow
            </h3>

            <form onSubmit={handleInitialize} className="mt-4 space-y-5" id="escrow-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Scholar First & Last Name
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1B4FD8] rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-hidden transition-all"
                      placeholder="e.g. Maria Santos"
                      value={localScholarName}
                      onChange={(e) => setLocalScholarName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Institution / University
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1B4FD8] rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-hidden transition-all"
                      placeholder="e.g. Quezon City University"
                      value={localSchool}
                      onChange={(e) => setLocalSchool(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Scholar Wallet Address (Stellar G-Address)
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 font-mono text-xs border border-slate-200 focus:border-[#1B4FD8] rounded-xl py-3 px-4 outline-hidden transition-all"
                  placeholder="GDH..."
                  value={localStudentAddr}
                  onChange={(e) => setLocalStudentAddr(e.target.value)}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  The individual G-address where the student possesses their private key.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Grant Amount (USDC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-sm font-bold text-slate-500">$</span>
                    <input
                      type="number"
                      className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1B4FD8] rounded-xl py-3 pl-8 pr-12 text-sm font-bold outline-hidden transition-all"
                      placeholder="175"
                      value={localAmount}
                      onChange={(e) => setLocalAmount(e.target.value)}
                      required
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">USDC</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">175 USDC ≈ ₱10,000 PHP</p>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Academic Term Semester
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <select
                      className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 border border-slate-200 focus:border-[#1B4FD8] rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-hidden transition-all appearance-none cursor-pointer"
                      value={localSemester}
                      onChange={(e) => setLocalSemester(e.target.value)}
                    >
                      <option value="1st Semester 2025–2026">1st Semester 2025–2026</option>
                      <option value="2nd Semester 2025–2026">2nd Semester 2025–2026</option>
                      <option value="Academic Year Summer 2026">AY Summer 2026</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInitializing || !walletAddress}
                className="w-full bg-[#1B4FD8] hover:bg-blue-800 active:scale-[0.99] text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
              >
                {isInitializing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Deploying Stellar Smart Contract...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Escrow with Stellar Smart Contract</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {!walletAddress && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-rose-700 font-semibold text-center mt-3">
                  ⚠️ Action disabled: Please connect your Freighter Admin wallet in the top navigation.
                </div>
              )}
            </form>
          </div>
        </div>

        {/* SECTION B: Status & Release panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Release card (visible when proof is submitted) */}
          {escrowStatus === "ProofSubmitted" ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="h-6 w-6 text-[#059669] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Crypto-Proof Verified ✓</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Scholar <b>{scholarName}</b> has uploaded their proof (Certificate of Registration). The document&apos;s SHA-256 fingerprint matches the enrollment parameters.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scholar:</span>
                  <span className="font-bold text-slate-800">{scholarName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Address:</span>
                  <span className="font-mono text-slate-700">{studentAddress.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount to Release:</span>
                  <span className="font-bold text-[#1B4FD8]">{scholarshipAmount} USDC (≈ ₱10,000)</span>
                </div>
              </div>

              <button
                onClick={handleReleaseFunds}
                disabled={isReleasing}
                className="w-full bg-[#F59E0B] hover:bg-amber-600 active:scale-[0.98] text-slate-900 font-extrabold py-3 px-5 rounded-xl transition-all shadow-xs text-sm cursor-pointer disabled:opacity-50"
              >
                {isReleasing ? "Releasing on public ledger..." : "Approve & Release Funds to Scholar"}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-xs">
              <span className="text-3xl select-none">⏳</span>
              <h4 className="font-bold text-slate-700 text-sm">No Unlocks Pending</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Once a student uploads and block hashes their enrollment document in their panel, you will see a validation alert here to release funds instantly.
              </p>
            </div>
          )}

          {/* Current Escrow Receipts */}
          {studentAddress ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-slate-900">Active Escrow Receipt</h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold leading-none ${
                  escrowStatus === "Pending" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                  escrowStatus === "Funded" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                  escrowStatus === "ProofSubmitted" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                  "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}>
                  {escrowStatus}
                </span>
              </div>

              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block">Scholar Name</span>
                  <span className="font-bold text-slate-1000 text-sm">{scholarName}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block">School / University</span>
                  <span className="font-semibold text-slate-600">{schoolName}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block">Student Stellar Address</span>
                  <span className="font-mono text-slate-700 text-[10.5px] break-all">{studentAddress}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block">Allocated Amount</span>
                    <span className="font-extrabold text-[#1B4FD8] text-base">{scholarshipAmount} USDC</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] block">Approx Value</span>
                    <span className="font-bold text-slate-700 text-base">₱10,000 PHP</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-[10.5px] text-slate-500 border border-slate-200 mt-4">
                System Code: Escrow smart contract is programmed on Stellar Testnet rules. Funds are currently locked. Refund is active if unspent within 90 days.
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/50 rounded-2xl p-6 text-center border border-dashed border-slate-300">
              <p className="text-xs text-slate-500">Escrow state is currently uninitialized. Please fill form or click the Demo data button in the banner inside the Admin view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
