import React, { useState } from 'react';
import { RotateCcw, Home, Clock, ShieldCheck } from 'lucide-react';
import { GameStats, DIFFICULTY_CONFIGS } from '../types/game';
import { formatDurationPrecise } from '../utils/formatters';
import { PrivacyModal } from './PrivacyModal';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore?: boolean;
  onRestart: () => void;
  onHome: () => void;
  onDataReset?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onHome,
  onDataReset,
}) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const miles = (stats.distanceFeet / 5280).toFixed(2);
  const diffCfg = stats.difficulty ? DIFFICULTY_CONFIGS[stats.difficulty] : DIFFICULTY_CONFIGS.normal;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#2b2b2e]/60 backdrop-blur-xs select-none safe-p-top safe-p-bottom">
      <div className="w-full max-w-md bg-[#ffffff] border-4 border-[#2b2b2e] p-5 sm:p-7 rounded-lg shadow-2xl relative text-center">
        {/* Torn paper sketch edge effect */}
        <div className="absolute -top-3 left-6 right-6 flex justify-between pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-3 h-5 bg-[#2b2b2e] rounded-sm transform -rotate-3" />
          ))}
        </div>

        {/* Title */}
        <div className="pt-2 mb-4">
          <h2 className="font-sketch text-3xl sm:text-4xl font-bold text-[#1e1e20] tracking-tight">
            GAME OVER
          </h2>
        </div>

        {/* Stats Card: Duration at Top, Distance & Blocks at Bottom */}
        <div className="bg-[#faf8f3] border-2 border-[#2b2b2e] rounded-lg p-4 sm:p-5 mb-4 text-center">
          {/* Top: Duration the user lasted */}
          <div className="border-b border-[#2b2b2e]/20 pb-3 mb-3">
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider text-[#606066] font-sketch font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-[#2b2b2e]" />
              <span>Duration Lasted</span>
            </div>
            <div className="font-mono-nums font-bold text-3xl sm:text-4xl text-[#1e1e20] tracking-tight">
              {formatDurationPrecise(stats.score)}
            </div>
            <div className="text-[11px] font-mono-nums text-[#707078] mt-1">
              Difficulty: <span className="font-bold text-[#1e1e20]">{diffCfg.label}</span>
            </div>
          </div>

          {/* Bottom: Distance & Blocks info */}
          <div className="grid grid-cols-2 gap-2.5 text-center pt-0.5">
            <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/20 rounded-lg">
              <span className="block text-[11px] uppercase tracking-wider text-[#606066] font-sketch font-bold">
                Distance
              </span>
              <span className="font-mono-nums font-bold text-base sm:text-lg text-[#1e1e20] block">
                {miles} mi
              </span>
              <span className="text-[10px] font-mono-nums text-[#707078] block">
                {Math.round(stats.distanceFeet).toLocaleString()} ft
              </span>
            </div>
            <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/20 rounded-lg">
              <span className="block text-[11px] uppercase tracking-wider text-[#606066] font-sketch font-bold">
                Blocks
              </span>
              <span className="font-mono-nums font-bold text-base sm:text-lg text-[#1e1e20] block">
                {stats.blocksTraversed}
              </span>
              <span className="text-[10px] font-mono-nums text-[#707078] block">
                Crossed
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-3">
          <button
            type="button"
            onClick={onRestart}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#2b2b2e] hover:bg-[#1a1a1c] text-white font-sketch text-lg font-bold rounded-lg border-2 border-[#2b2b2e] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            type="button"
            onClick={onHome}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#faf8f3] hover:bg-[#ede9df] text-[#2b2b2e] font-sketch text-base font-bold rounded-lg border-2 border-[#2b2b2e] shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>

        {/* Privacy Note in Footer */}
        <div className="pt-2 border-t border-[#2b2b2e]/15 flex items-center justify-center gap-1.5 text-[11px] text-[#606065]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Scores are stored 100% locally.</span>
          <button
            type="button"
            onClick={() => setIsPrivacyOpen(true)}
            className="font-bold underline text-[#242426] hover:text-[#000000] cursor-pointer"
          >
            Privacy & Storage
          </button>
        </div>
      </div>

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        onDataReset={onDataReset}
      />
    </div>
  );
};
