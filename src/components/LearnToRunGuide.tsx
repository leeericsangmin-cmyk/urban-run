import React, { useState, useEffect } from 'react';
import {
  Compass,
  Heart,
  Waves,
  CloudRain,
  Play,
  Home,
  X,
  CheckCircle2,
  Smartphone,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { TaxiIcon, EBikeIcon, CrowdIcon } from './ObstacleIcons';
import { Direction } from '../types/game';

export type GuideStep = 1 | 'navigating_1' | 2 | 'navigating_2' | 3 | 'practice';

interface LearnToRunGuideProps {
  step: GuideStep;
  onStep1Resume: (dir?: Direction) => void;
  onStep2Resume: () => void;
  onSkipToStep2?: () => void;
  onSkipToStep3?: () => void;
  onStartActualRun: () => void;
  onBackToStart: () => void;
  onExitGuide: () => void;
}

export const LearnToRunGuide: React.FC<LearnToRunGuideProps> = ({
  step,
  onStep1Resume,
  onStep2Resume,
  onSkipToStep2,
  onSkipToStep3,
  onStartActualRun,
  onBackToStart,
  onExitGuide,
}) => {
  // Mobile / touch screen detection
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
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
  }, []);


  // Step 1: Listen for arrow keys/WASD on PC or touch swipe motion on mobile
  useEffect(() => {
    if (step !== 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let dir: Direction = 'NONE';
      if (e.key === 'ArrowUp' || e.code === 'KeyW' || e.key === 'w' || e.key === 'W') dir = 'UP';
      else if (e.key === 'ArrowDown' || e.code === 'KeyS' || e.key === 's' || e.key === 'S') dir = 'DOWN';
      else if (e.key === 'ArrowLeft' || e.code === 'KeyA' || e.key === 'a' || e.key === 'A') dir = 'LEFT';
      else if (e.key === 'ArrowRight' || e.code === 'KeyD' || e.key === 'd' || e.key === 'D') dir = 'RIGHT';

      if (dir !== 'NONE') {
        e.preventDefault();
        onStep1Resume(dir);
      }
    };

    let touchStart: { x: number; y: number } | null = null;
    let didTrigger = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        didTrigger = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart || didTrigger || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      const minDistance = 18;

      if (Math.abs(dx) >= minDistance || Math.abs(dy) >= minDistance) {
        didTrigger = true;
        const dir: Direction =
          Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'RIGHT' : 'LEFT')
            : (dy > 0 ? 'DOWN' : 'UP');

        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch {
          // Ignore haptic errors
        }

        onStep1Resume(dir);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart || didTrigger || e.changedTouches.length === 0) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      const minDistance = 15;

      if (Math.abs(dx) >= minDistance || Math.abs(dy) >= minDistance) {
        didTrigger = true;
        const dir: Direction =
          Math.abs(dx) > Math.abs(dy)
            ? (dx > 0 ? 'RIGHT' : 'LEFT')
            : (dy > 0 ? 'DOWN' : 'UP');

        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        } catch {
          // Ignore haptic errors
        }

        onStep1Resume(dir);
      }
      touchStart = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [step, onStep1Resume]);

  // Between Step 1 and Step 2: 5 seconds of user navigating surrounding map
  useEffect(() => {
    if (step !== 'navigating_1') return;

    const timer = setTimeout(() => {
      onSkipToStep2?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [step, onSkipToStep2]);

  // Step 2: Automatically moves on to the next navigation phase after 5 seconds
  useEffect(() => {
    if (step !== 2) return;

    const timer = setTimeout(() => {
      onStep2Resume();
    }, 5000);

    return () => clearTimeout(timer);
  }, [step, onStep2Resume]);

  // Between Step 2 and Step 3: 5 seconds of user playing around with obstacles
  useEffect(() => {
    if (step !== 'navigating_2') return;

    const timer = setTimeout(() => {
      onSkipToStep3?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [step, onSkipToStep3]);

  // Step 3: Automatically exits out to home page after 5 seconds
  const [step3Seconds, setStep3Seconds] = useState<number>(5);
  useEffect(() => {
    if (step !== 3) return;
    setStep3Seconds(5);

    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setStep3Seconds(count);
      if (count <= 0) {
        clearInterval(interval);
        onBackToStart();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, onBackToStart]);

  // Hide bottom countdown overlays during free-run transition phases
  if (step === 'navigating_1' || step === 'navigating_2') {
    return null;
  }

  // If in practice mode after completing all steps, show a small floating badge with exit button
  if (step === 'practice') {
    return (
      <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-16 sm:right-4 z-40 select-none pointer-events-auto">
        <div className="bg-[#ffffff] border-2 border-[#2b2b2e] px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-sketch font-bold text-xs text-[#1e1e20]">
            Practice Run
          </span>
          <button
            type="button"
            onClick={onStartActualRun}
            className="px-1.5 py-0.5 bg-[#2b2b2e] text-white text-[10px] font-sketch font-bold rounded cursor-pointer hover:bg-black"
          >
            Play Real Game
          </button>
          <button
            type="button"
            onClick={onExitGuide}
            aria-label="Exit Guide"
            className="p-0.5 hover:bg-[#eae5d8] rounded text-[#2b2b2e] cursor-pointer"
            title="Exit to Menu"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    /* Non-blocking wrapper: positioned above the bottom Keyboard/Mobile Controls bar */
    <div className="fixed inset-0 z-40 pointer-events-none flex items-end justify-center sm:justify-end px-2.5 sm:px-4 pt-16 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-16">
      {/* Compact Floating Guide Card */}
      <div
        role="dialog"
        aria-label={`Learn to Run Guide - Step ${step}`}
        className="w-full max-w-[330px] sm:max-w-[295px] max-h-[38vh] sm:max-h-[calc(100vh-9rem)] overflow-y-auto bg-[#ffffff]/95 backdrop-blur-xs border-2 border-[#2b2b2e] p-2 sm:p-3 rounded-lg shadow-xl pointer-events-auto relative text-left animate-in slide-in-from-bottom-2 duration-200 select-none"
      >
        {/* Top-Right Exit Button */}
        <button
          type="button"
          onClick={onExitGuide}
          aria-label="Exit Learn to Run guide at any time"
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-0.5 px-1.5 py-0.5 text-[9.5px] font-sketch font-bold text-[#b91c1c] bg-[#fee2e2] hover:bg-[#fecaca] rounded border border-[#ef4444] transition-colors cursor-pointer"
          title="Exit Guide"
        >
          <X className="w-2.5 h-2.5 stroke-[2.5]" />
          <span>EXIT</span>
        </button>

        {/* ================= STEP 1: NAVIGATION & CONTROLS ================= */}
        {step === 1 && (
          <div>
            {/* Compact Header */}
            <div className="flex items-center gap-1 text-[#0284c7] pr-12">
              {isTouchDevice ? (
                <Smartphone className="w-3 h-3 shrink-0" />
              ) : (
                <Compass className="w-3 h-3 shrink-0" />
              )}
              <span className="font-mono-nums font-bold text-[9px] uppercase tracking-wider">
                {isTouchDevice ? 'Step 1/3 · Mobile Swipe' : 'Step 1/3 · Navigation'}
              </span>
            </div>

            <h3 className="font-sketch text-base sm:text-lg font-bold text-[#1e1e20] leading-tight">
              {isTouchDevice ? 'Swipe Anywhere to Steer' : 'Navigation & Steering'}
            </h3>

            <p className="text-[10px] text-[#45454a] leading-snug mb-1.5">
              {isTouchDevice ? (
                <>
                  Runner sprints forward automatically—<strong>swipe</strong> to turn into streets.
                </>
              ) : (
                <>
                  Stickman sprints forward—steer into streets using <strong>Arrow keys</strong> or <strong>WASD</strong>.
                </>
              )}
            </p>

            {/* Mobile Swipe Showcase (compact 1-row 4-way strip) */}
            {isTouchDevice ? (
              <div className="bg-[#faf8f3] border border-[#2b2b2e]/25 rounded-md p-1.5 mb-1.5">
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => onStep1Resume('UP')}
                    className="py-1 px-1 bg-[#ffffff] hover:bg-[#ede8dc] active:bg-[#dfd9cc] border border-[#2b2b2e]/30 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <span className="text-xs leading-none">⬆️</span>
                    <span className="font-sketch font-bold text-[10px] text-[#1e1e20] leading-none">Up</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStep1Resume('DOWN')}
                    className="py-1 px-1 bg-[#ffffff] hover:bg-[#ede8dc] active:bg-[#dfd9cc] border border-[#2b2b2e]/30 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <span className="text-xs leading-none">⬇️</span>
                    <span className="font-sketch font-bold text-[10px] text-[#1e1e20] leading-none">Down</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStep1Resume('LEFT')}
                    className="py-1 px-1 bg-[#ffffff] hover:bg-[#ede8dc] active:bg-[#dfd9cc] border border-[#2b2b2e]/30 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <span className="text-xs leading-none">⬅️</span>
                    <span className="font-sketch font-bold text-[10px] text-[#1e1e20] leading-none">Left</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onStep1Resume('RIGHT')}
                    className="py-1 px-1 bg-[#ffffff] hover:bg-[#ede8dc] active:bg-[#dfd9cc] border border-[#2b2b2e]/30 rounded flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 transition-all shadow-2xs"
                  >
                    <span className="text-xs leading-none">➡️</span>
                    <span className="font-sketch font-bold text-[10px] text-[#1e1e20] leading-none">Right</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Desktop Keys Showcase (when on computer) */
              <div className="bg-[#faf8f3] border border-[#2b2b2e]/25 rounded p-1.5 mb-1.5">
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="p-1 bg-[#ffffff] border border-[#2b2b2e]/20 rounded flex items-center gap-1.5">
                    <div className="flex flex-col gap-0.5 items-center">
                      <kbd className="px-1 py-0.2 bg-[#eae5d8] border border-[#2b2b2e] rounded text-[9px] font-mono-nums font-bold">
                        ↑
                      </kbd>
                      <div className="flex gap-0.5">
                        <kbd className="px-1 py-0.2 bg-[#eae5d8] border border-[#2b2b2e] rounded text-[9px] font-mono-nums font-bold">
                          ←
                        </kbd>
                        <kbd className="px-1 py-0.2 bg-[#eae5d8] border border-[#2b2b2e] rounded text-[9px] font-mono-nums font-bold">
                          ↓
                        </kbd>
                        <kbd className="px-1 py-0.2 bg-[#eae5d8] border border-[#2b2b2e] rounded text-[9px] font-mono-nums font-bold">
                          →
                        </kbd>
                      </div>
                    </div>
                    <div>
                      <span className="font-sketch font-bold text-[10px] text-[#303035] block leading-none">PC Keys</span>
                      <span className="text-[8px] text-[#606065]">Arrows / WASD</span>
                    </div>
                  </div>

                  <div className="p-1 bg-[#ffffff] border border-[#2b2b2e]/20 rounded flex items-center gap-1.5">
                    <div className="w-7 h-7 bg-[#eae5d8] border border-[#2b2b2e] rounded flex items-center justify-center text-xs shrink-0 font-bold">
                      👆
                    </div>
                    <div>
                      <span className="font-sketch font-bold text-[10px] text-[#303035] block leading-none">Mobile App</span>
                      <span className="text-[8px] text-[#606065]">Swipe ⬆️⬇️⬅️➡️</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onStep1Resume('UP')}
              className="w-full py-1.5 bg-[#2b2b2e] hover:bg-black text-white text-[11px] font-sketch font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>
                {isTouchDevice ? 'SWIPE SCREEN OR TAP TO START' : 'START 5s PRACTICE RUN'}
              </span>
            </button>
          </div>
        )}

        {/* ================= STEP 2: URBAN OBSTACLES ================= */}
        {step === 2 && (
          <div>
            {/* Compact Header */}
            <div className="flex items-center gap-1 text-amber-700 pr-12">
              <Compass className="w-3 h-3 shrink-0" />
              <span className="font-mono-nums font-bold text-[9px] uppercase tracking-wider">
                Step 2/3 · Obstacles
              </span>
            </div>

            <h3 className="font-sketch text-base sm:text-lg font-bold text-[#1e1e20] leading-tight mb-1">
              Watch the Road!
            </h3>

            {/* Compact 3-column grid on mobile, detailed rows on desktop */}
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-1 sm:gap-1 mb-1.5 text-xs">
              {/* 1. Yellow Taxis */}
              <div className="p-1.5 bg-[#faf8f3] border border-[#2b2b2e]/25 rounded flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-1.5 text-center sm:text-left">
                <div className="shrink-0 p-0.5 bg-white border border-[#2b2b2e]/20 rounded">
                  <TaxiIcon className="w-6 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-sketch font-bold text-[10.5px] sm:text-[11px] text-[#1e1e20] flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 leading-tight">
                    <span>Taxis</span>
                    <span className="text-[8px] font-mono-nums text-rose-700 font-bold bg-rose-50 px-1 rounded border border-rose-200">
                      -35 HP
                    </span>
                  </div>
                  <p className="hidden sm:block text-[9.5px] text-[#4b4b52] leading-tight">
                    Cross-traffic. Listen for horn honks at intersections!
                  </p>
                </div>
              </div>

              {/* 2. Bicycles and E-Bikes */}
              <div className="p-1.5 bg-[#faf8f3] border border-[#2b2b2e]/25 rounded flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-1.5 text-center sm:text-left">
                <div className="shrink-0 p-0.5 bg-white border border-[#2b2b2e]/20 rounded">
                  <EBikeIcon className="w-5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-sketch font-bold text-[10.5px] sm:text-[11px] text-[#1e1e20] flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 leading-tight">
                    <span>Bikes</span>
                    <span className="sm:hidden text-[8px] font-mono-nums text-rose-700 font-bold bg-rose-50 px-1 rounded border border-rose-200">
                      -35 HP
                    </span>
                  </div>
                  <p className="hidden sm:block text-[9.5px] text-[#4b4b52] leading-tight">
                    Agile with bell chimes. Dodge through narrow gaps!
                  </p>
                </div>
              </div>

              {/* 3. Pedestrian Crowds */}
              <div className="p-1.5 bg-[#faf8f3] border border-[#2b2b2e]/25 rounded flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-1.5 text-center sm:text-left">
                <div className="shrink-0 p-0.5 bg-white border border-[#2b2b2e]/20 rounded">
                  <CrowdIcon className="w-4 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-sketch font-bold text-[10.5px] sm:text-[11px] text-[#1e1e20] flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 leading-tight">
                    <span>Crowds</span>
                    <span className="text-[8px] font-mono-nums text-amber-700 font-bold bg-amber-50 px-1 rounded border border-amber-200">
                      Slows
                    </span>
                  </div>
                  <p className="hidden sm:block text-[9.5px] text-[#4b4b52] leading-tight">
                    Dashed ring clusters. Weave around them!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onStep2Resume}
              className="w-full py-1.5 bg-[#2b2b2e] hover:bg-black text-white font-sketch text-[11px] sm:text-xs font-bold rounded transition-transform active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>RESUME RUNNING</span>
            </button>
          </div>
        )}

        {/* ================= STEP 3: HEALTH BAR & GAME OVER ================= */}
        {step === 3 && (
          <div>
            {/* Compact Header */}
            <div className="flex items-center gap-1 text-rose-700 pr-12">
              <Compass className="w-3 h-3 shrink-0" />
              <span className="font-mono-nums font-bold text-[9px] uppercase tracking-wider">
                Step 3/3 · Rules
              </span>
            </div>

            <h3 className="font-sketch text-base sm:text-lg font-bold text-[#1e1e20] leading-tight mb-1">
              Health & Game Over
            </h3>

            {/* Compact 3-column summary on mobile, detailed cards on desktop */}
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-1 sm:gap-1 mb-1.5 text-xs">
              {/* 1. Health Bar */}
              <div className="p-1 sm:p-1.5 bg-[#faf8f3] border border-[#2b2b2e]/25 rounded flex flex-col sm:block items-center text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-between gap-0.5 mb-0.5">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-600 shrink-0" />
                    <span className="font-sketch font-bold text-[10.5px] sm:text-[11px] text-[#1e1e20] leading-none">
                      Health
                    </span>
                  </div>
                  <span className="hidden sm:inline font-mono-nums text-[8px] font-bold px-1 bg-rose-50 text-rose-800 rounded border border-rose-200">
                    Top-Left HUD
                  </span>
                </div>
                <p className="text-[8.5px] sm:text-[9.5px] text-[#404045] leading-tight">
                  <span className="sm:hidden">
                    Depletes = <strong className="text-rose-700">Game Over</strong>
                  </span>
                  <span className="hidden sm:inline">
                    When health depletes, it is{' '}
                    <strong className="text-rose-700">Game Over!</strong>
                  </span>
                </p>
              </div>

              {/* 2. Perimeter Rivers */}
              <div className="p-1 sm:p-1.5 bg-[#faf8f3] border border-[#2b2b2e]/25 rounded flex flex-col sm:flex-row items-center sm:items-start gap-0.5 sm:gap-1.5 text-center sm:text-left">
                <div className="flex items-center gap-1 sm:block">
                  <Waves className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284c7] shrink-0 sm:mt-0.5" />
                  <span className="sm:hidden font-sketch font-bold text-[10.5px] text-[#1e1e20] leading-none">
                    River
                  </span>
                </div>
                <div>
                  <span className="hidden sm:block font-sketch font-bold text-[11px] text-[#1e1e20] leading-none mb-0.5">
                    River
                  </span>
                  <p className="text-[8.5px] sm:text-[9.5px] text-[#404045] leading-tight">
                    <span className="sm:hidden">
                      <strong className="text-[#0284c7]">Avoid river!</strong> Instant out
                    </span>
                    <span className="hidden sm:inline">
                      <strong>Avoid the river</strong> — touching it is instant Game Over.
                    </span>
                  </p>
                </div>
              </div>

              {/* 3. Creeping Storm Hazard */}
              <div className="p-1 sm:p-1.5 bg-[#faf8f3] border border-[#2b2b2e]/25 rounded flex flex-col sm:flex-row items-center sm:items-start gap-0.5 sm:gap-1.5 text-center sm:text-left">
                <div className="flex items-center gap-1 sm:block">
                  <CloudRain className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#dc2626] shrink-0 sm:mt-0.5" />
                  <span className="sm:hidden font-sketch font-bold text-[10.5px] text-[#1e1e20] leading-none">
                    Storm
                  </span>
                </div>
                <div>
                  <span className="hidden sm:block font-sketch font-bold text-[11px] text-[#1e1e20] leading-none mb-0.5">
                    Storm
                  </span>
                  <p className="text-[8.5px] sm:text-[9.5px] text-[#404045] leading-tight">
                    <span className="sm:hidden">
                      <strong className="text-[#dc2626]">Avoid storm!</strong> Run north
                    </span>
                    <span className="hidden sm:inline">
                      <strong>Avoid the storm</strong> — keep running north!
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Compact side-by-side on mobile, stacked on desktop */}
            <div className="pt-1.5 border-t border-[#2b2b2e]/20">
              <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 sm:gap-1">
                <button
                  type="button"
                  onClick={onStartActualRun}
                  className="w-full py-1.5 px-2 bg-[#2b2b2e] hover:bg-black text-white font-sketch text-[11px] sm:text-xs font-bold rounded border border-[#2b2b2e] shadow-sm flex items-center justify-center gap-1 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current shrink-0" />
                  <span>PLAY GAME</span>
                </button>

                <button
                  type="button"
                  onClick={onBackToStart}
                  className="w-full py-1.5 sm:py-1 px-2 bg-[#faf8f3] hover:bg-[#ede9df] text-[#2b2b2e] font-sketch text-[11px] sm:text-xs font-bold rounded border border-[#2b2b2e] shadow-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Home className="w-3 h-3 shrink-0" />
                  <span>HOME ({step3Seconds}s)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
