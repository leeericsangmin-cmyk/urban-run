import React, { useState } from 'react';
import { X, ShieldCheck, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { getAllStoredScores, clearAllLocalGameData, SCORE_KEYS } from '../utils/storage';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset?: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose, onDataReset }) => {
  const [scores, setScores] = useState(() => getAllStoredScores());
  const [resetConfirmed, setResetConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleResetData = () => {
    clearAllLocalGameData();
    setScores(getAllStoredScores());
    setResetConfirmed(true);
    if (onDataReset) {
      onDataReset();
    }
    setTimeout(() => setResetConfirmed(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2b2b2e]/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-[#ffffff] border-4 border-[#2b2b2e] p-6 sm:p-7 rounded-lg shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close privacy modal"
          className="absolute top-4 right-4 p-1.5 rounded hover:bg-[#ede9df] text-[#2b2b2e] border border-[#2b2b2e]/30 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-dashed border-[#2b2b2e]/20">
          <div className="p-2 bg-emerald-50 border-2 border-emerald-700 text-emerald-800 rounded-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sketch text-2xl font-bold text-[#1e1e20] leading-none">
              PRIVACY & STORAGE
            </h3>
            <span className="text-[11px] font-mono-nums font-semibold text-[#047857]">
              Zero-PII · 100% Local Device Storage
            </span>
          </div>
        </div>

        {/* Core Statutory Disclosure */}
        <div className="mb-4 p-3.5 bg-[#faf8f3] border-2 border-[#2b2b2e] rounded-lg">
          <p className="text-xs sm:text-[13px] leading-relaxed text-[#242426] font-medium">
            "Urban Run operates 100% locally on your device. We do not use cookies, tracking scripts, accounts, or analytics. Your high scores are stored exclusively in your browser's local storage and are never sent to any external server. Clearing your browser cache or site data will reset your scores."
          </p>
        </div>

        {/* Storage Transparency Breakdown */}
        <div className="mb-5 space-y-2.5 text-xs text-[#404045]">
          <div className="flex items-center gap-1.5 text-xs font-sketch font-bold text-[#1e1e20] uppercase tracking-wide">
            <Lock className="w-3.5 h-3.5 text-[#2b2b2e]" />
            <span>Active Local Storage Keys:</span>
          </div>

          <div className="bg-[#f8f6f0] border border-[#2b2b2e]/30 rounded p-2.5 space-y-1.5 font-mono-nums text-[11px]">
            <div className="flex justify-between items-center pb-1 border-b border-[#2b2b2e]/10">
              <span className="text-[#64748b]">{SCORE_KEYS.easy}:</span>
              <span className="font-bold text-[#1e1e20]">{scores.easy} pts</span>
            </div>
            <div className="flex justify-between items-center pb-1 border-b border-[#2b2b2e]/10">
              <span className="text-[#64748b]">{SCORE_KEYS.normal}:</span>
              <span className="font-bold text-[#1e1e20]">{scores.normal} pts</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748b]">{SCORE_KEYS.hard}:</span>
              <span className="font-bold text-[#1e1e20]">{scores.hard} pts</span>
            </div>
          </div>

          <p className="text-[11px] text-[#606065] leading-normal">
            No persistent user IDs (UUIDs), advertising beacons, location trackers, or hardware fingerprints are generated or retained. Fully compliant with GDPR, ePrivacy Article 5(3), and COPPA.
          </p>
        </div>

        {/* Reset Action & Confirmation */}
        <div className="pt-3 border-t border-[#2b2b2e]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {resetConfirmed ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-sketch font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>LOCAL DATA CLEARED!</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sketch font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>RESET SAVED SCORES</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-[#2b2b2e] text-white font-sketch text-sm font-bold rounded-lg border-2 border-[#2b2b2e] hover:bg-[#1a1a1c] transition-colors cursor-pointer"
          >
            CLOSE DISCLOSURE
          </button>
        </div>
      </div>
    </div>
  );
};
