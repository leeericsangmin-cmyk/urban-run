import React, { useState, useEffect } from 'react';
import { Move, Keyboard } from 'lucide-react';
import { Direction } from '../types/game';

interface ControlsOverlayProps {
  onDirectionInput?: (dir: Direction) => void;
  activeDirection?: Direction;
  isMobile?: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  isMobile: forcedMobile,
}) => {
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof forcedMobile === 'boolean') return forcedMobile;
    if (typeof window !== 'undefined') {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    }
    return false;
  });

  useEffect(() => {
    if (typeof forcedMobile === 'boolean') {
      setIsTouchDevice(forcedMobile);
      return;
    }
    const checkTouch = () => {
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(isTouch);
    };
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, [forcedMobile]);

  // Desktop keyboard helper (shown only when using a computer / non-touch device)
  if (!isTouchDevice) {
    return (
      <div className="absolute inset-x-0 bottom-3 pointer-events-none z-20 flex justify-center px-4 select-none">
        <div className="flex flex-wrap items-center justify-center gap-2 bg-[#faf8f3]/95 backdrop-blur-xs border border-[#2b2b2e]/30 px-3.5 py-1.5 rounded-md text-xs text-[#4b4b50] shadow-xs text-center">
          <Keyboard className="w-3.5 h-3.5 text-[#202024] shrink-0" />
          <span className="font-sketch font-bold text-[#202024]">KEYBOARD CONTROLS:</span>
          <span>Arrow Keys or [W A S D] to turn (Hold key to go faster)</span>
          <span aria-hidden="true" className="text-[#a0a0a5]">·</span>
          <span className="font-sketch font-bold text-[#1e1e20]">On mobile: Swipe &amp; hold to boost</span>
          <span aria-hidden="true" className="text-[#a0a0a5]">·</span>
          <span>Space to Pause</span>
        </div>
      </div>
    );
  }

  // Mobile / Touch: Clean, non-intrusive swipe guidance banner
  return (
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] inset-x-0 pointer-events-none z-20 flex justify-center px-4 select-none animate-in fade-in duration-300">
      <div className="flex items-center gap-2 bg-[#faf8f3]/95 backdrop-blur-xs border-2 border-[#2b2b2e]/35 px-4 py-1.5 rounded-full text-xs text-[#3b3b40] shadow-sm">
        <Move className="w-3.5 h-3.5 text-[#202024] shrink-0" />
        <span className="font-sketch font-bold text-[#202024] tracking-wide">
          MOBILE CONTROLS:
        </span>
        <span className="font-sketch font-medium text-[#3b3b40]">
          Swipe &amp; slide (⬆️ ⬇️ ⬅️ ➡️) to turn &amp; go faster
        </span>
      </div>
    </div>
  );
};

