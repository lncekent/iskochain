import React, { useState, useEffect } from "react";
import { 
  Globe, Clock, Search, ExternalLink, ArrowDownLeft, ShieldCheck, 
  HelpCircle, RefreshCw, Layers 
} from "lucide-react";
import { getTransactionHistory, MOCK_ESCROW_ADDRESS } from "../stellar";

interface TransparencyFeedProps {
  escrowStatus: "Pending" | "Funded" | "ProofSubmitted" | "Released" | "Refunded";
  scholarshipAmount: number;
  scholarName: string;
  studentAddress: string;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function TransparencyFeed({
  escrowStatus,
  scholarshipAmount,
  scholarName,
  studentAddress,
  addToast,
}: TransparencyFeedProps) {
  const [liveTxs, setLiveTxs] = useState<any[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to pull real transactions from the public Stellar testnet anchor account or escrow target
  const fetchLedgerActivities = async () => {
    setLoadingTxs(true);
    try {
      // Fetch history for the collective demo escrow address
      const history = await getTransactionHistory(MOCK_ESCROW_ADDRESS);
      setLiveTxs(history);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn("Could not query live testnet activities, falling back to mock stream.", err);
    } finally {
      setLoadingTxs(false);
    }
  };

  useEffect(() => {
    fetchLedgerActivities();

    // Poll every 15 seconds to sync the live indicator block
    const interval = setInterval(() => {
      fetchLedgerActivities();
    }, 15000);

    return () => clearInterval(interval);
  }, [escrowStatus]);

  // Combined stream: Merge simulated actions with real Stellar testnet transactions
  const getMergedStream = () => {
    const list: any[] = [];

    // Inject active user states as simulated real-time transactions to ensure the UI updates dynamically for the hackathon
    if (escrowStatus === "Released") {
      list.push({
        id: "sim-released",
        type: "DISBURSEMENT",
        typeName: "Scholarship Disbursed",
        scholar: scholarName || "Maria Santos",
        amount: `${scholarshipAmount} USDC`,
        address: studentAddress || "GAE2GD...",
        timestamp: "Just now",
        txHash: "8b9f5dca8a3e77f0a1c182dd90a1eff20ca11466def5f2081fbbab100bc00dac",
        status: "Success",
      });
    }

    if (escrowStatus === "ProofSubmitted" || escrowStatus === "Released") {
      list.push({
        id: "sim-proof",
        type: "PROOF_SUBMISSION",
        typeName: "Crypto Proof Anchored",
        scholar: scholarName || "Maria Santos",
        amount: "SHA-256 Digest Record",
        address: studentAddress || "GAE2GD...",
        timestamp: "5 minutes ago",
        txHash: "d4b1a43ffb4fa11a43a89e9f90f20ca11466def5f2081fbbab100bc00daeee44",
        status: "Indexed",
      });
    }

    if (escrowStatus === "Funded" || escrowStatus === "ProofSubmitted" || escrowStatus === "Released") {
      list.push({
        id: "sim-deposit",
        type: "ESCROW_DEPOSIT",
        typeName: "Escrow Deposit Locked",
        scholar: scholarName || "Maria Santos",
        amount: `${scholarshipAmount} USDC`,
        address: MOCK_ESCROW_ADDRESS,
        timestamp: "12 minutes ago",
        txHash: "17b12fca12e377f0a1c182dd90a1eff20ca11466def5f2071fbbab100bc00da12",
        status: "Escrow Locked",
      });
    }

    // Default mock background logs to enrich the public display
    list.push(
      {
        id: "mock-1",
        type: "DISBURSEMENT",
        typeName: "Scholarship Disbursed",
        scholar: "Juan dela Cruz",
        amount: "175 USDC",
        address: "GA5W355PZQ77D6ZJKTJKF92X46RE66MUPJ3M2GD5WTYUKUPLD7GAEA4J",
        timestamp: "2 hours ago",
        txHash: "7b1c3c9f2b3e8ad02b88b0a1eff20ca11466def5f2081fbbab100bc00daeee12",
        status: "Success",
      },
      {
        id: "mock-2",
        type: "PROOF_SUBMISSION",
        typeName: "Crypto Proof Anchored",
        scholar: "Juan dela Cruz",
        amount: "SHA-256 Document Hash",
        address: "GA5W355PZQ...",
        timestamp: "2 hours ago",
        txHash: "daeee4466def5f2081fbbab100bc0007b1c3c9f2b3e8ad02b88b0a1eff20ca114",
        status: "Indexed",
      },
      {
        id: "mock-3",
        type: "ESCROW_DEPOSIT",
        typeName: "Escrow Deposit Locked",
        scholar: "Juan dela Cruz",
        amount: "175 USDC",
        address: MOCK_ESCROW_ADDRESS,
        timestamp: "4 hours ago",
        txHash: "bc00daeee4466def5f2081fbbab10017fca12e377f0a1c182dd90a1eff20ca114",
        status: "Escrow Locked",
      },
      {
        id: "mock-4",
        type: "DISBURSEMENT",
        typeName: "Scholarship Disbursed",
        scholar: "Jose Rizal Jr.",
        amount: "175 USDC",
        address: "GBQLX6K3LHY3MXR7G7SCDWS43DQXAQA6NDD2G77XCSYEXYJ7PZPHXNCS",
        timestamp: "1 day ago",
        txHash: "e4466def5f2081fbbab100bc00daeed4b1a43ffb4fa11a43a89e9f90f20ca114",
        status: "Success",
      }
    );

    // If we have live blockchain feeds, append them as on-chain system operations
    if (liveTxs.length > 0) {
      liveTxs.forEach((tx: any, idx: number) => {
        list.push({
          id: `stellar-${tx.id || idx}`,
          type: "STELLAR_TX",
          typeName: "On-Chain Ledger Operation",
          scholar: "System Anchor Channel",
          amount: `${(Number(tx.fee_charged) / 10000000).toFixed(6)} XLM Fee`,
          address: tx.source_account,
          timestamp: tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : "Stellar Sync",
          txHash: tx.hash,
          status: "Ledger Secured",
          isReal: true,
        });
      });
    }

    return list;
  };

  const stream = getMergedStream();

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Public Ledger Analytics 🔍</h2>
          <p className="text-xs text-slate-500 mt-0.5">Every single tax peso locked, processed, and disbursed — 100% visible, fully accounted.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
          <span className="relative flex h-2 w-2 mr-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-705">Live Sync Active</span>
          <button 
            onClick={fetchLedgerActivities}
            title="Force refresh"
            disabled={loadingTxs}
            className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loadingTxs ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Scholarships Active", val: "18,204", metric: "QC Scholars" },
          { label: "Realized disbursements", val: "2,350 USDC", metric: "≈ ₱135,000 Volume" },
          { label: "Avg Release Speed", val: "3.2 Seconds", metric: "Zero Bureau Wait" },
          { label: "Ledger Verification", val: "On-Chain", metric: "Powered by Soroban" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">{stat.label}</span>
            <span className="text-lg md:text-xl font-black text-slate-900 block mt-1">{stat.val}</span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">{stat.metric}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Stream feeds list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-[#1B4FD8]" />
              Dynamic Ledger Streams
            </h3>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
              {stream.map((tx) => (
                <div 
                  key={tx.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    tx.isReal 
                      ? "bg-blue-50/20 border-blue-100" 
                      : tx.type === "DISBURSEMENT" 
                      ? "bg-emerald-50/20 border-emerald-100" 
                      : "bg-slate-50/30 border-slate-200/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-xl text-xs font-bold leading-none shrink-0 ${
                        tx.type === "DISBURSEMENT" ? "bg-emerald-100 text-[#059669]" :
                        tx.type === "PROOF_SUBMISSION" ? "bg-purple-100 text-purple-800" :
                        tx.type === "ESCROW_DEPOSIT" ? "bg-blue-100 text-[#1B4FD8]" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {tx.type === "DISBURSEMENT" ? "Disbursed" : 
                         tx.type === "PROOF_SUBMISSION" ? "Proof Anchored" :
                         tx.type === "ESCROW_DEPOSIT" ? "Escrow Locked" : "Stellar Hop"}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-extrabold text-xs text-slate-900">{tx.typeName}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">• {tx.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {tx.type === "STELLAR_TX" ? (
                            <>Gas transaction processed at anchor <b>{tx.address.slice(0, 12)}...</b></>
                          ) : (
                            <>Scholar: <b>{tx.scholar}</b> | Value: <b>{tx.amount}</b></>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <span className="font-mono text-[9.5px] bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-500">
                        TX: {tx.txHash.slice(0, 8)}...
                      </span>
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#1B4FD8] p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-200"
                        title="Review ledger hash on Stellar Expert"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Comparison card (Why this matters) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white rounded-2xl p-6 shadow-sm space-y-4 border border-slate-800">
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-blue-300" />
              Before &amp; After IskoChain
            </h3>
            
            <p className="text-slate-300 text-xs leading-relaxed">
              Manual document reviews used to lock scholarship payouts behind weeks of paper queues. IskoChain makes disbursement instant, transparent, and conditional.
            </p>

            <div className="space-y-4 text-xs">
              <div className="border-b border-white/10 pb-2">
                <span className="text-[9px] font-bold text-sky-400 block uppercase tracking-wider">Before IskoChain</span>
                <span className="text-rose-300 font-semibold block mt-0.5">⏱️ 2–3 Months delays</span>
                <p className="text-slate-300 mt-0.5 text-[10.5px]">Manual verification bottlenecks</p>
              </div>

              <div className="border-b border-white/10 pb-2">
                <span className="text-[9px] font-bold text-sky-400 block uppercase tracking-wider">With IskoChain</span>
                <span className="text-emerald-300 font-extrabold block mt-0.5">⚡ Under 5 seconds speed</span>
                <p className="text-slate-300 mt-0.5 text-[10.5px]">Conditional decentralized release</p>
              </div>

              <div>
                <span className="text-[9px] font-bold text-sky-400 block uppercase tracking-wider">Audit Accountability</span>
                <span className="text-sky-200 font-semibold block mt-0.5">🔒 Zero loss or leaks</span>
                <p className="text-slate-300 mt-0.5 text-[10.5px]">Public Ledger visibility maps every single centavo perfectly.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
