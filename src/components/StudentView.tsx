import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, Upload, CheckCircle2, ChevronRight, Loader2, Sparkles, 
  ExternalLink, Wallet, HelpCircle, FileUp 
} from "lucide-react";
import { hashFile } from "../stellar";

interface StudentViewProps {
  walletAddress: string | null;
  escrowStatus: "Pending" | "Funded" | "ProofSubmitted" | "Released" | "Refunded";
  setEscrowStatus: (status: "Pending" | "Funded" | "ProofSubmitted" | "Released" | "Refunded") => void;
  scholarshipAmount: number;
  scholarName: string;
  className?: string;
  usdcBalance: string;
  xlmBalance: string;
  onConnectWallet: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function StudentView({
  walletAddress,
  escrowStatus,
  setEscrowStatus,
  scholarshipAmount,
  scholarName,
  usdcBalance,
  xlmBalance,
  onConnectWallet,
  addToast,
}: StudentViewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      addToast("File format not supported. Please upload JPG, PNG, or PDF.", "error");
      return;
    }
    
    setSelectedFile(file);
    setIsHashing(true);
    addToast("Generating secure SHA-256 on-chain fingerprint inside browser...", "info");

    // Artificial wait to simulate file processing/hashing
    setTimeout(async () => {
      try {
        const hash = await hashFile(file);
        setFileHash(hash);
        addToast("Document hashed! Digital fingerprint created.", "success");
      } catch (err) {
        addToast("Failed to compute SHA-256 digest.", "error");
      } finally {
        setIsHashing(false);
      }
    }, 1500);
  };

  const handleSubmitProof = () => {
    if (!walletAddress) {
      addToast("Please connect your Freighter wallet.", "error");
      return;
    }
    setIsSubmittingProof(true);
    addToast("Submitting proof state to Stellar Testnet...", "info");

    setTimeout(() => {
      setEscrowStatus("ProofSubmitted");
      setIsSubmittingProof(false);
      addToast("✓ Proof submitted! QCYDO is notified for fund release.", "success");
    }, 1800);
  };

  // Convert status to stepper state
  const steps = [
    { title: "Escrow Created", desc: "QCYDO initialized", activeStatuses: ["Pending", "Funded", "ProofSubmitted", "Released"] },
    { title: "Funded", desc: "Sponsor locked USDC", activeStatuses: ["Funded", "ProofSubmitted", "Released"] },
    { title: "Proof Submitted", desc: "Voter hashes set", activeStatuses: ["ProofSubmitted", "Released"] },
    { title: "Released", desc: "Scholar disbursed", activeStatuses: ["Released"] },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Kumusta, {scholarName || "Maria Santos"}! 👋</h2>
          <p className="text-slate-500 text-sm mt-1">Scholar at <span className="font-semibold">Quezon City University</span> • 1st Semester 2025–2026</p>
        </div>
        {walletAddress ? (
          <div className="text-right shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Wallet Balance</span>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-bold text-[#1B4FD8]">{parseFloat(usdcBalance).toFixed(2)} USDC</span>
              <span className="text-slate-400 text-xs font-medium">≈ ₱{parseFloat(usdcBalance) > 0 ? (parseFloat(usdcBalance) * 58).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "0.00"} PHP</span>
            </div>
          </div>
        ) : (
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100 select-none">Freighter Disconnected</span>
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 block">Decentralized Disbursement Pipeline</h3>

        {/* Stepper container */}
        <div className="flex flex-col sm:flex-row justify-between mb-8 relative gap-6 sm:gap-2">
          {/* Background line */}
          <div className="absolute top-5 left-4 sm:left-0 right-4 sm:right-0 h-0.5 bg-slate-100 -z-0 hidden sm:block"></div>
          <div 
            className="absolute top-5 left-0 h-0.5 bg-[#1B4FD8] -z-0 transition-all duration-500 hidden sm:block font-sans"
            style={{ width: escrowStatus === "Released" ? "100%" : escrowStatus === "ProofSubmitted" ? "66%" : escrowStatus === "Funded" ? "33%" : "0%" }}
          ></div>
          
          {steps.map((step, idx) => {
            const isCompleted = step.activeStatuses.includes(escrowStatus);
            const isCurrent = (escrowStatus === "Pending" && idx === 0) || 
                              (escrowStatus === "Funded" && idx === 1) || 
                              (escrowStatus === "ProofSubmitted" && idx === 2) || 
                              (escrowStatus === "Released" && idx === 3);

            return (
              <div key={idx} className="flex sm:flex-col items-center gap-2 z-10 relative text-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm select-none transition-all duration-300 ${
                  isCompleted 
                    ? "bg-[#1B4FD8] text-white ring-4 ring-white" 
                    : isCurrent 
                    ? "bg-[#1B4FD8]/10 text-[#1B4FD8] font-bold border border-[#1B4FD8] ring-4 ring-slate-50" 
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>
                <div className="sm:mt-2 text-left sm:text-center block">
                  <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isCompleted ? "text-slate-900" : isCurrent ? "text-[#1B4FD8]" : "text-slate-400"
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{step.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main action panels */}
        <div className="md:col-span-8 space-y-6">
          
          {/* STEP 1: Not Connected */}
          {!walletAddress && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
              <span className="text-4xl select-none">🔐</span>
              <h3 className="text-base font-bold text-slate-900">Wallet Pair Required</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Please hook your Freighter wallet browser extension in order to submit hashed proofs and read your live Stellar token balance.
              </p>
              <button
                onClick={onConnectWallet}
                className="bg-[#1B4FD8] hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl text-xs cursor-pointer shadow-sm active:scale-[0.98]"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {/* STEP 2: Awaiting sponsor funding */}
          {walletAddress && escrowStatus === "Pending" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
              <span className="text-4xl select-none">💰</span>
              <h3 className="text-base font-bold text-slate-900">Awaiting Sponsor Funding</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Excellent! Your scholarship is initialized on-chain. We are waiting for the Sponsor to fund the escrow with <b>{scholarshipAmount} USDC</b>.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200/60 max-w-sm mx-auto text-[11px] text-slate-600 leading-relaxed">
                🌱 <b>Demo Shortcut:</b> Head over to the &quot;Sponsor&quot; tab using the navigation menu and click the **Fund Scholarship** button to fast forward.
              </div>
            </div>
          )}

          {/* STEP 3: Upload panel (visible when status === "Funded") */}
          {walletAddress && escrowStatus === "Funded" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
              <h3 className="text-sm font-bold text-slate-900">Upload Enrollment Verification</h3>
              <p className="text-xs text-slate-500">
                The smart contract requires proof of registration before releasing funds. Upload your class schedule enrollment sheet. We will hash it securely.
              </p>

              {/* Drag n Drop block */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? "border-[#1B4FD8] bg-blue-50/50" 
                    : "border-slate-200 hover:border-[#1B4FD8] hover:bg-slate-50/30"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-blue-50 rounded-2xl text-[#1B4FD8]">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-700">Upload Certificate of Registration (COR)</h4>
                  <p className="text-[10.5px] text-slate-400">Drag & drop or Click to browse</p>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">JPG, PNG, PDF formats accepted</span>
                </div>
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="h-5 w-5 text-slate-500 shrink-0" />
                      <div>
                        <h5 className="font-bold text-xs text-slate-800">{selectedFile.name}</h5>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    {isHashing && (
                      <div className="flex items-center text-xs text-[#1B4FD8] font-bold space-x-1">
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        <span>Hashing...</span>
                      </div>
                    )}
                  </div>

                  {fileHash && (
                    <div className="space-y-1.5 text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px] block">Cryptographic SHA-256 Digest</span>
                      <code className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 block text-[10.5px] font-mono select-all break-all text-blue-900">
                        {fileHash}
                      </code>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed mt-2">
                        💡 <b>Zero-Knowledge Blueprint:</b> This SHA-256 hash is a digital fingerprint of your COR. We record only this hash to Stellar, keeping your actual document private.
                      </p>

                      <button
                        onClick={handleSubmitProof}
                        disabled={isSubmittingProof}
                        className="w-full bg-[#1B4FD8] hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer pt-3 mt-4 disabled:opacity-50"
                      >
                        {isSubmittingProof ? "Submitting hashed envelope to Stellar..." : "Submit Fingerprint to Stellar Ledger"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Proof Submitted awaiting release */}
          {walletAddress && escrowStatus === "ProofSubmitted" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
              <span className="text-4xl select-none">⏱️</span>
              <h3 className="text-base font-bold text-slate-900">Proof Submitted & Under Review</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Fantastic job, scholar! Your proof footprint of the Certificate of Registration is cataloged on-chain. QCYDO admins have been notified to unlock your funds.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl text-left border border-slate-200/60 max-w-sm mx-auto text-[11px] text-[#1B4FD8] leading-relaxed">
                💡 <b>Demo Shortcut:</b> Return to the **QCYDO Admin** tab. Under Section B, click **Approve & Release Funds to Scholar** to trigger simulated payout immediately!
              </div>
            </div>
          )}

          {/* STEP 5: Released receipt (Disbursed) */}
          {walletAddress && escrowStatus === "Released" && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center space-y-5 relative overflow-hidden">
              <div className="space-y-2">
                <span className="inline-block text-5xl animate-bounce">🎉</span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#059669] block">Payout Received</span>
                <h3 className="text-3xl font-black text-emerald-950 select-none">₱10,000 RECEIVED!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Your scholarship allocation has been safely released from the smart contract directly onto your Stellar G-address wallet.
                </p>
              </div>

              <div className="bg-white/60 backdrop-blur-xs p-4 rounded-2xl border border-emerald-100 max-w-xs mx-auto text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Disbursed Amount:</span>
                  <span className="font-extrabold text-slate-950">{scholarshipAmount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Disbursement speed:</span>
                  <span className="font-bold text-[#059669]">3.2 Seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Traditional queue wait:</span>
                  <span className="line-through text-slate-400">2–3 Months</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://stellar.expert/explorer/testnet/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-[#1B4FD8] hover:text-blue-800 font-bold bg-white px-5 py-2.5 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50"
                >
                  <span>Verify Settlement on Stellar Explorer</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Informative Sidebar component */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-[#1B4FD8]" />
              Frequently Asked
            </h4>
            <ul className="space-y-4 text-xs text-slate-600">
              <li className="space-y-1">
                <b className="text-slate-800 block">Do I pay network fees?</b>
                <span>No. Stellar tx fees are fractions of a cent ($0.00001). QCYDO sponsors pay gas using fee sponsor channels.</span>
              </li>
              <li className="space-y-1">
                <b className="text-slate-800 block">Is my documents data secure?</b>
                <span>Yes. Only the computed SHA-256 hash (fingerprint) is published, making it impossible to reconstruct your personal PDF document.</span>
              </li>
              <li className="space-y-1">
                <b className="text-slate-800 block">Where can I spend my USDC?</b>
                <span>You can redeem USDC for Philippine Pesos instantly at GCash, Maya, or any Stellar anchor endpoint inside QC.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
