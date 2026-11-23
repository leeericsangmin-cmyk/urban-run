import React from 'react';
import { Pause, Play, X, Heart } from 'lucide-react';
import { StickmanPlayer, GameStats, DifficultyLevel } from '../types/game';

interface GameHUDProps {
  player: StickmanPlayer;
  isPaused: boolean;
  onTogglePause: () => void;
  isGuideMode?: boolean;
  onExitGuide?: () => void;
  // Optional legacy props maintained for compatibility
  stats?: GameStats;
  difficulty?: DifficultyLevel;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onOpenLegend?: () => void;
  onOpenPrivacy?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player,
  isPaused,
  onTogglePause,
  isGuideMode = false,
  onExitGuide,
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((player.hp / player.maxHp) * 100)));
  const isCritical = hpPercent <= 25;

  return (
    <header className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-3 sm:p-4 safe-p-top flex items-center justify-between">
      {/* HP Bar on the Top-Left */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 bg-[#faf8f3]/95 backdrop-blur-sm border-2 border-[#2b2b2e] px-3 py-1.5 rounded-lg shadow-sm select-none">
        <Heart
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
            isCritical ? 'text-rose-600 fill-rose-600 animate-pulse' : 'text-[#2b2b2e] fill-[#2b2b2e]'
          }`}
          aria-hidden="true"
        />
        <div className="w-28 sm:w-44 h-4 bg-[#e5e0d3] border border-[#2b2b2e] rounded-sm overflow-hidden relative">
          <div
            className={`h-full transition-all duration-200 ${
              isCritical
                ? 'bg-rose-600 animate-pulse'
                : hpPercent < 50
                ? 'bg-amber-600'
                : 'bg-[#2b2b2e]'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20 px-1">
            <span className="border-r border-[#2b2b2e] h-full" />
            <span className="border-r border-[#2b2b2e] h-full" />
            <span className="border-r border-[#2b2b2e] h-full" />
          </div>
        </div>
        <span className="font-mono-nums text-xs sm:text-sm font-semibold text-[#202024] w-10 text-right">
          {hpPercent}%
        </span>
      </div>

      {/* Top Right: Pause button (and exit guide in guide mode if available) */}
      <div className="pointer-events-auto flex items-center gap-2 select-none">
        {isGuideMode && onExitGuide && (
          <button
            onClick={onExitGuide}
            aria-label="Exit Learn to Run guide"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-sketch font-bold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg border-2 border-red-300 transition-colors cursor-pointer active:scale-95 shadow-sm"
            title="Exit Guide"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXIT GUIDE</span>
          </button>
        )}

        <button
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume game' : 'Pause game'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-sketch font-bold text-[#202024] bg-[#faf8f3]/95 hover:bg-[#ede9df] active:bg-[#ded7c8] backdrop-blur-sm rounded-lg border-2 border-[#2b2b2e] shadow-sm transition-transform active:scale-95 cursor-pointer"
          title={isPaused ? 'Resume game' : 'Pause game'}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          <span>{isPaused ? 'RESUME' : 'PAUSE'}</span>
        </button>
      </div>
    </header>
  );
};
