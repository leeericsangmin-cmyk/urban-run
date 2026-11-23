import React, { useState } from 'react';
import { Play, BookOpen, Gauge, ShieldCheck } from 'lucide-react';
import { District, DifficultyLevel, DIFFICULTY_CONFIGS } from '../types/game';
import { formatDuration } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';
import { AddToHomeScreenGuide } from './AddToHomeScreenGuide';
import { PrivacyModal } from './PrivacyModal';

interface TitleMenuProps {
  onStartGame: (district: District, difficulty: DifficultyLevel) => void;
  onStartLearnToRun: (district: District) => void;
  selectedDistrict: District;
  onChangeDistrict: (d: District) => void;
  selectedDifficulty: DifficultyLevel;
  onChangeDifficulty: (diff: DifficultyLevel) => void;
  highScore: number;
  onDataReset?: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  onStartGame,
  onStartLearnToRun,
  selectedDistrict,
  onChangeDistrict,
  selectedDifficulty,
  onChangeDifficulty,
  highScore,
  onDataReset,
}) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const currentDiffConfig = DIFFICULTY_CONFIGS[selectedDifficulty] || DIFFICULTY_CONFIGS.normal;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-[#f8f6f0]/95 overflow-y-auto safe-p-top safe-p-bottom">
      {/* Hand-drawn sketchbook page container */}
      <div className="w-full max-w-xl bg-[#ffffff] border-4 border-[#2b2b2e] p-6 sm:p-8 rounded-lg shadow-xl relative my-auto">
        {/* Decorative sketchbook spiral binding holes along top */}
        <div className="absolute -top-3 left-8 right-8 flex justify-between pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-6 bg-[#2b2b2e] rounded-sm transform rotate-6 border border-[#faf8f3]"
            />
          ))}
        </div>

        {/* Header Title with Install Action */}
        <div className="text-center pt-2 mb-5 border-b-2 border-dashed border-[#2b2b2e]/30 pb-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="w-8 hidden sm:block" />
            <h1 className="font-sketch text-4xl sm:text-5xl font-bold tracking-tight text-[#1e1e20] mx-auto">
              URBAN RUN
            </h1>
            <div className="hidden sm:block">
              <PWAInstallButton variant="compact" />
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            {highScore > 0 && (
              <span className="text-xs font-mono-nums font-semibold px-2 py-0.5 bg-[#faf8f3] border border-[#2b2b2e]/30 rounded text-[#1e1e20]">
                BEST SURVIVAL ({currentDiffConfig.label.toUpperCase()}): <strong className="font-bold">{formatDuration(highScore)}</strong>
              </span>
            )}
            <div className="sm:hidden">
              <PWAInstallButton variant="compact" />
            </div>
          </div>
        </div>

        {/* Difficulty Level Selection */}
        <div className="mb-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-sketch font-bold text-[#202025] uppercase tracking-wide flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[#2b2b2e]" />
              Select Difficulty:
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map((level) => {
              const cfg = DIFFICULTY_CONFIGS[level];
              const isSelected = selectedDifficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChangeDifficulty(level)}
                  className={`p-3 rounded-lg border-2 text-center transition-all relative cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'border-[#2b2b2e] bg-[#2b2b2e] text-white shadow-md'
                      : 'border-[#2b2b2e]/30 bg-[#faf8f3] hover:bg-[#ede9df] text-[#2b2b2e]'
                  }`}
                >
                  <span className="font-sketch font-bold text-base block">
                    {cfg.label}
                  </span>
                  <span className={`text-[10px] block font-mono-nums ${isSelected ? 'text-zinc-300' : 'text-[#64748b]'}`}>
                    {cfg.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Action Buttons Row: Start Run & Learn to Run */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1 mb-4">
          <button
            type="button"
            onClick={() => onStartGame(selectedDistrict, selectedDifficulty)}
            className="w-full sm:w-auto px-7 py-3 bg-[#2b2b2e] hover:bg-[#1a1a1c] active:bg-[#000000] text-white font-sketch text-xl font-bold tracking-wide rounded-lg border-2 border-[#2b2b2e] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
          >
            <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
            <span>START RUN ({currentDiffConfig.label.toUpperCase()})</span>
          </button>

          <button
            type="button"
            onClick={() => onStartLearnToRun(selectedDistrict)}
            className="w-full sm:w-auto px-6 py-3 bg-[#faf8f3] hover:bg-[#ede9df] active:bg-[#dfd9cc] text-[#242426] font-sketch text-xl font-bold tracking-wide rounded-lg border-2 border-[#2b2b2e] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
            title="Interactive in-game guide to learn game mechanics and obstacles"
          >
            <BookOpen className="w-5 h-5 text-[#0284c7] transition-transform group-hover:scale-110" />
            <span>LEARN TO RUN</span>
          </button>
        </div>

        {/* In-game Install App Action (available on supported browsers/devices) */}
        <div className="flex justify-center mb-3">
          <PWAInstallButton variant="menu" />
        </div>

        {/* Quick Guide to Add to Home Screen (Android & iOS) */}
        <AddToHomeScreenGuide />

        {/* Footer Privacy Disclosure & Storage Management */}
        <div className="pt-3 border-t border-[#2b2b2e]/20 text-center">
          <p className="text-[11px] leading-relaxed text-[#55555c] max-w-xl mx-auto">
            "Urban Run operates 100% locally on your device. We do not use cookies, tracking scripts, accounts, or analytics. Your high scores are stored exclusively in your browser's local storage and are never sent to any external server. Clearing your browser cache or site data will reset your scores."
          </p>

          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-sketch font-bold text-[#242426] hover:underline cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>View Privacy & Local Storage Details</span>
            </button>
          </div>
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
