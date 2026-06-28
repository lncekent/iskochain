import React, { useState, useEffect } from "react";
import { 
  connectWallet, disconnectWallet, getBalance, HORIZON_URL, MOCK_ESCROW_ADDRESS, 
  NETWORK, NETWORK_PASSPHRASE, queryContract, parseEnum, CONTRACT_ID 
} from "./stellar";
import Navbar from "./components/Navbar";
import AdminView from "./components/AdminView";
import SponsorView from "./components/SponsorView";
import StudentView from "./components/StudentView";
import TransparencyFeed from "./components/TransparencyFeed";
import { GraduationCap, Landmark, ExternalLink, HelpCircle } from "lucide-react";

interface Toast {
  id: number;
  msg: string;
  type: "success" | "error" | "info";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("student");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [freighterInstalled, setFreighterInstalled] = useState(true);

  // Core Demo States
  const [escrowStatus, setEscrowStatus] = useState<"Uninitialized" | "Pending" | "Funded" | "ProofSubmitted" | "Released" | "Refunded">("Uninitialized");
  const [scholarshipAmount, setScholarshipAmount] = useState<number>(175);
  const [studentAddress, setStudentAddress] = useState<string>("GDNS7RJXWL2L2NTZ6TESPH6D4SPT3VAONOUGADO5BIC3QDOEHLJG2FNR");
  const [scholarName, setScholarName] = useState<string>("Maria Santos");
  const [schoolName, setSchoolName] = useState<string>("Quezon City University");

  // Wallet balances
  const [usdcBalance, setUsdcBalance] = useState<string>("0.00000");
  const [xlmBalance, setXlmBalance] = useState<string>("0.00000");

  // Custom Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check Freighter availability on load
  useEffect(() => {
    import("@stellar/freighter-api").then(({ isConnected }) => {
      isConnected().then((installed) => {
        setFreighterInstalled(!!installed);
      });
    });
  }, []);

  // Fetch balances when walletAddress changes
  const fetchBalancesUpdate = async () => {
    if (!walletAddress) return;
    try {
      const bal = await getBalance(walletAddress);
      setUsdcBalance(bal.usdc);
      setXlmBalance(bal.xlm);
    } catch (err) {
      console.warn("Could not query live Freighter balances:", err);
    }
  };

  const syncWithContractState = async () => {
    try {
      const rawStatus = await queryContract(CONTRACT_ID, "get_status");
      const statusStr = parseEnum(rawStatus);
      if (["Pending", "Funded", "ProofSubmitted", "Released", "Refunded"].includes(statusStr)) {
        setEscrowStatus(statusStr as any);
      }
      
      const rawAmount = await queryContract(CONTRACT_ID, "get_amount");
      if (rawAmount !== null && rawAmount !== undefined) {
        setScholarshipAmount(Number(BigInt(rawAmount)) / 10000000);
      }
      
      const rawStudent = await queryContract(CONTRACT_ID, "get_student");
      if (rawStudent) {
        setStudentAddress(rawStudent);
      }
    } catch (err) {
      console.warn("Contract not initialized yet or not found on-chain. Keeping default mock values.", err);
    }
  };

  useEffect(() => {
    syncWithContractState();
    const interval = setInterval(() => {
      syncWithContractState();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchBalancesUpdate();

      // Poll every 10 seconds as requested
      const interval = setInterval(() => {
        fetchBalancesUpdate();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [walletAddress]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const pubKey = await connectWallet();
      setWalletAddress(pubKey);
      addToast("✓ Wallet connected successfully!", "success");
    } catch (err: any) {
      console.error(err);
      if (err.message === "CONNECTION_DISMISSED") {
        addToast("Wallet connection selection dismissed.", "info");
      } else if (err.message === "WALLET_NOT_INSTALLED") {
        addToast("Selected wallet is not installed or active.", "error");
      } else {
        addToast("Wallet connection declined or locked.", "error");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnectWallet();
    } catch (err) {
      console.warn("Error disconnecting wallet through kit:", err);
    }
    setWalletAddress(null);
    setUsdcBalance("0.00000");
    setXlmBalance("0.00000");
    addToast("Wallet disconnected safely.", "info");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-950 font-sans flex flex-col pb-12">
      {/* Top Navigation */}
      <Navbar
        walletAddress={walletAddress}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnectWallet}
        xlmBalance={xlmBalance}
        usdcBalance={usdcBalance}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnecting={isConnecting}
        freighterInstalled={freighterInstalled}
      />

      {/* Hero Stat Banner */}
      <div className="bg-[#1B4FD8] px-4 sm:px-8 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Active Scholars</span>
            <span className="text-white font-semibold text-sm">18,000 QC Scholars</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-blue-500/30"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Avg Grant Amount</span>
            <span className="text-white font-semibold text-sm">~₱10,000 avg grant</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-blue-500/30"></div>
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Disbursement Speed</span>
            <span className="text-white font-semibold text-sm">&lt;5.0 sec total</span>
          </div>
        </div>
        <span className="text-blue-100 text-xs font-semibold bg-white/10 px-3.5 py-1 rounded-full border border-white/10">
          Zero Transaction Fees
        </span>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* HERO BANNER SECTION (Shown when wallet is not connected OR as standard introduction layout) */}
        {!walletAddress && (
          <section className="bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-sm mb-8 relative overflow-hidden" id="hero-landing">
            <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-blue-50/70 to-transparent pointer-events-none hidden md:block"></div>
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#1B4FD8] px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-blue-100 uppercase tracking-widest">
                <GraduationCap className="h-4 w-4" />
                <span>Conditional Scholarship Settlement</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                IskoChain <span className="text-[#F59E0B] select-none">🎓</span>
              </h1>
              <p className="text-slate-600 text-sm md:text-base font-medium leading-relaxed">
                Scholarship disbursement on Stellar — no more waiting, no more excuses. Resolving months of manual bureaucracy with conditional smart locks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleConnectWallet}
                  className="bg-[#1B4FD8] hover:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl text-xs shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                >
                  Pair Freighter Wallet
                </button>
                <button
                  onClick={() => setActiveTab("transparency")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl text-xs transition-all cursor-pointer"
                >
                  View Public Audit Feed 🔍
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ACTIVE MODULE VIEW */}
        <div className="transition-all duration-200" id="main-view-container">
          {activeTab === "admin" && (
            <AdminView
              walletAddress={walletAddress}
              escrowStatus={escrowStatus}
              setEscrowStatus={setEscrowStatus}
              scholarshipAmount={scholarshipAmount}
              setScholarshipAmount={setScholarshipAmount}
              studentAddress={studentAddress}
              setStudentAddress={setStudentAddress}
              scholarName={scholarName}
              setScholarName={setScholarName}
              schoolName={schoolName}
              setSchoolName={setSchoolName}
              addToast={addToast}
              syncWithContractState={syncWithContractState}
            />
          )}

          {activeTab === "sponsor" && (
            <SponsorView
              walletAddress={walletAddress}
              escrowStatus={escrowStatus}
              setEscrowStatus={setEscrowStatus}
              scholarshipAmount={scholarshipAmount}
              scholarName={scholarName}
              schoolName={schoolName}
              studentAddress={studentAddress}
              usdcBalance={usdcBalance}
              xlmBalance={xlmBalance}
              refreshBalances={fetchBalancesUpdate}
              addToast={addToast}
              syncWithContractState={syncWithContractState}
            />
          )}

          {activeTab === "student" && (
            <StudentView
              walletAddress={walletAddress}
              escrowStatus={escrowStatus}
              setEscrowStatus={setEscrowStatus}
              scholarshipAmount={scholarshipAmount}
              scholarName={scholarName}
              usdcBalance={usdcBalance}
              xlmBalance={xlmBalance}
              onConnectWallet={handleConnectWallet}
              addToast={addToast}
              syncWithContractState={syncWithContractState}
            />
          )}

          {activeTab === "transparency" && (
            <TransparencyFeed
              escrowStatus={escrowStatus}
              scholarshipAmount={scholarshipAmount}
              scholarName={scholarName}
              studentAddress={studentAddress}
              addToast={addToast}
              syncWithContractState={syncWithContractState}
            />
          )}
        </div>
      </main>

      {/* TOAST SYSTEM CONTAINER */}
      <div className="fixed bottom-5 right-5 space-y-2.5 max-w-sm w-full z-50 pointer-events-none" id="toast-manager">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-xs font-bold flex items-center justify-between cursor-pointer animate-fade-in-up transition-all ${
              t.type === "success"
                ? "bg-emerald-600 text-white border-emerald-500"
                : t.type === "error"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            <span>{t.msg}</span>
            <button className="text-[10px] opacity-70 ml-2">close</button>
          </div>
        ))}
      </div>
    </div>
  );
}
