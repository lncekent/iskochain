import React from "react";
import { Wallet, Globe, Copy, Check, LogOut, Terminal } from "lucide-react";

interface NavbarProps {
  walletAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  xlmBalance: string;
  usdcBalance: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isConnecting: boolean;
  freighterInstalled: boolean;
}

export default function Navbar({
  walletAddress,
  onConnect,
  onDisconnect,
  xlmBalance,
  usdcBalance,
  activeTab,
  setActiveTab,
  isConnecting,
  freighterInstalled,
}: NavbarProps) {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#1B4FD8] rounded-lg flex items-center justify-center shadow-xs">
              <span className="text-white font-bold text-lg select-none">I</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#0F172A] flex items-center gap-1.5 leading-none">
                IskoChain
                <span className="text-[#F59E0B] text-sm select-none">🎓</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">Stellar PH Bootcamp &apos;26</p>
            </div>
          </div>

          {/* Navigation Tabs - Desktop */}
          <nav className="hidden md:flex space-x-6 h-full items-center" id="desktop-nav">
            {[
              { id: "student", label: "Student View" },
              { id: "admin", label: "Admin (QCYDO)" },
              { id: "sponsor", label: "Sponsor" },
              { id: "transparency", label: "Transparency" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer transition-colors text-sm font-semibold h-full pt-1.5 flex items-center border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "text-[#1B4FD8] border-[#1B4FD8]"
                    : "text-slate-500 border-transparent hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Wallet Actions */}
          <div className="flex items-center space-x-4">
            {/* Stellar Testnet Tag */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              <div className="w-2 h-2 bg-[#059669] rounded-full"></div>
              <span className="text-xs font-semibold text-slate-600">Stellar Testnet</span>
            </div>

            {/* Freighter Status Link */}
            {!freighterInstalled && (
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold px-3 py-1.5 rounded-xl border border-amber-200 transition-all shadow-xs"
              >
                Install Freighter ↗
              </a>
            )}

            {walletAddress ? (
              <div className="flex items-center space-x-3">
                {/* Balance display */}
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#1B4FD8]">
                    {parseFloat(usdcBalance).toFixed(2)} USDC
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {parseFloat(xlmBalance).toFixed(2)} XLM
                  </span>
                </div>

                {/* Account card */}
                <div className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all">
                  <button
                    onClick={copyAddress}
                    className="text-xs font-mono font-medium text-slate-600 hover:text-[#1B4FD8] flex items-center space-x-1"
                    title="Click to copy Address"
                  >
                    <span>{truncateAddress(walletAddress)}</span>
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600 ml-1" />
                    ) : (
                      <div className="w-2 h-2 bg-[#059669] rounded-full ring-4 ring-emerald-50 ml-1.5"></div>
                    )}
                  </button>
                  <button
                    onClick={onDisconnect}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="bg-[#1B4FD8] hover:bg-blue-800 active:scale-[0.98] text-white text-xs font-bold py-2.5 px-4.5 rounded-xl transition-all inline-flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Wallet className="h-4 w-4" />
                <span>{isConnecting ? "Connecting..." : "Connect Freighter"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Mobile */}
        <div className="flex md:hidden overflow-x-auto pb-3 space-x-2.5 scrollbar-none border-t border-slate-100 pt-2.5">
          {[
            { id: "student", label: "Scholar" },
            { id: "admin", label: "Admin" },
            { id: "sponsor", label: "Sponsor" },
            { id: "transparency", label: "Public Feed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-[#1B4FD8] text-white"
                  : "text-slate-600 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
