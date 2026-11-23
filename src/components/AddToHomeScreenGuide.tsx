import React, { useState } from 'react';
import {
  Smartphone,
  Share,
  MoreVertical,
  PlusSquare,
  Download,
  CheckCircle,
  Zap,
  WifiOff,
  Maximize2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const AddToHomeScreenGuide: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();

  // Default active tab based on detected platform, defaulting to Android if unknown
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(() => {
    if (isIOS) return 'ios';
    return 'android';
  });

  // Collapsed by default as requested
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 5000);
    }
  };

  return (
    <div className="w-full mb-5 bg-[#faf8f3] border-2 border-[#2b2b2e] rounded-lg shadow-sm text-left overflow-hidden transition-all">
      {/* Header bar with toggle */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`px-3.5 py-2.5 bg-[#f0ebd9] ${
          isExpanded ? 'border-b-2 border-[#2b2b2e]/30' : ''
        } flex items-center justify-between cursor-pointer select-none hover:bg-[#eae3ce] transition-colors`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((prev) => !prev);
          }
        }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center flex-wrap gap-2 min-w-0">
          <Smartphone className="w-4 h-4 text-[#2b2b2e] shrink-0" />
          <span className="font-sketch font-bold text-sm sm:text-base text-[#1e1e20] tracking-wide leading-tight">
            Install App on Phone (Android & Apple)
          </span>
          {isInstalled ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono-nums font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-600 rounded shrink-0">
              <CheckCircle className="w-3 h-3" />
              STANDALONE APP
            </span>
          ) : (
            <span className="text-[10px] font-mono-nums font-semibold px-1.5 py-0.5 bg-[#2b2b2e] text-white rounded shrink-0">
              WEB APP
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#525258] font-sketch font-bold shrink-0 ml-2">
          <span>{isExpanded ? 'Hide' : 'Quick Guide'}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[#2b2b2e]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#2b2b2e]" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 sm:p-4">
          {/* Status banner when already running as standalone app */}
          {isInstalled && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-400 rounded-md flex items-center gap-2 text-xs text-emerald-900">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Running in Standalone App Mode!</strong> Urban Run is currently open like a native app without browser URL bars.
              </span>
            </div>
          )}

          {/* Subtitle / value proposition */}
          <p className="text-xs text-[#4b4b52] leading-relaxed mb-3">
            Add <strong>Urban Run</strong> to your phone's home screen to play in full-screen mode without browser address bars, with instant loading and offline support.
          </p>

          {/* Platform Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`py-1.5 px-3 rounded-md font-sketch font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                activeTab === 'android'
                  ? 'bg-[#2b2b2e] text-white border-[#2b2b2e] shadow-xs'
                  : 'bg-[#ffffff] text-[#424248] border-[#2b2b2e]/40 hover:bg-[#f3eedf]'
              }`}
            >
              <span>🤖 Android (Chrome/Edge)</span>
              {isAndroid && (
                <span className="text-[9px] font-mono-nums px-1 bg-amber-400 text-black font-semibold rounded">
                  Your OS
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`py-1.5 px-3 rounded-md font-sketch font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                activeTab === 'ios'
                  ? 'bg-[#2b2b2e] text-white border-[#2b2b2e] shadow-xs'
                  : 'bg-[#ffffff] text-[#424248] border-[#2b2b2e]/40 hover:bg-[#f3eedf]'
              }`}
            >
              <span>🍎 iOS (iPhone Safari)</span>
              {isIOS && (
                <span className="text-[9px] font-mono-nums px-1 bg-sky-400 text-black font-semibold rounded">
                  Your OS
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: Android Instructions */}
          {activeTab === 'android' && (
            <div className="space-y-2.5">
              {/* Direct 1-click install button if available */}
              {isInstallable && (
                <div className="p-2.5 bg-[#ffffff] border-2 border-emerald-600 rounded-md flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-sketch font-bold text-[#1e1e20]">
                      Your browser supports 1-click install!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectInstall}
                    className="w-full sm:w-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-sketch font-bold text-xs rounded border border-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Install App Now</span>
                  </button>
                </div>
              )}

              {installSuccess && (
                <div className="p-2 bg-emerald-100 border border-emerald-600 text-emerald-900 rounded text-xs font-sketch font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Success! Urban Run has been added to your app drawer / home screen.</span>
                </div>
              )}

              {/* Step 1 */}
              <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/30 rounded-md flex items-start gap-2.5">
                <span className="font-sketch font-bold text-sm text-[#1e1e20] w-5 h-5 flex items-center justify-center bg-[#eae5d8] border border-[#2b2b2e] rounded-full shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-[#35353a] leading-snug">
                  <span className="font-sketch font-bold text-sm text-[#1e1e20] block mb-0.5">
                    Open Chrome Menu
                  </span>
                  Tap the <strong className="font-bold">three vertical dots</strong>{' '}
                  <span className="inline-flex items-center px-1 py-0.2 bg-[#f0ebd9] border border-[#2b2b2e]/40 rounded text-[11px] font-mono-nums">
                    <MoreVertical className="w-3 h-3 inline text-[#1e1e20]" />
                  </span>{' '}
                  in the top-right corner of your browser.
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/30 rounded-md flex items-start gap-2.5">
                <span className="font-sketch font-bold text-sm text-[#1e1e20] w-5 h-5 flex items-center justify-center bg-[#eae5d8] border border-[#2b2b2e] rounded-full shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-[#35353a] leading-snug">
                  <span className="font-sketch font-bold text-sm text-[#1e1e20] block mb-0.5">
                    Select "Add to Home screen"
                  </span>
                  In the menu list, tap <strong className="font-bold">"Add to Home screen"</strong> (or{' '}
                  <strong className="font-bold">"Install app"</strong>).
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/30 rounded-md flex items-start gap-2.5">
                <span className="font-sketch font-bold text-sm text-[#1e1e20] w-5 h-5 flex items-center justify-center bg-[#eae5d8] border border-[#2b2b2e] rounded-full shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs text-[#35353a] leading-snug">
                  <span className="font-sketch font-bold text-sm text-[#1e1e20] block mb-0.5">
                    Confirm & Play
                  </span>
                  Tap <strong className="font-bold">"Install"</strong> or <strong className="font-bold">"Add"</strong>.
                  The Urban Run pencil runner icon is created on your home screen!
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: iOS Instructions */}
          {activeTab === 'ios' && (
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/30 rounded-md flex items-start gap-2.5">
                <span className="font-sketch font-bold text-sm text-[#1e1e20] w-5 h-5 flex items-center justify-center bg-[#eae5d8] border border-[#2b2b2e] rounded-full shrink-0 mt-0.5">
                  1
                </span>
                <div className="text-xs text-[#35353a] leading-snug">
                  <span className="font-sketch font-bold text-sm text-[#1e1e20] block mb-0.5">
                    Open Safari & Tap Share
                  </span>
                  In Apple Safari, tap the <strong className="font-bold">Share button</strong>{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-[#f0ebd9] border border-[#2b2b2e]/40 rounded text-[11px] font-mono-nums text-[#0284c7]">
                    <Share className="w-3 h-3 inline mr-1 stroke-[2.5]" />
                    Share
                  </span>{' '}
                  on the bottom toolbar (or top bar on iPad).
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/30 rounded-md flex items-start gap-2.5">
                <span className="font-sketch font-bold text-sm text-[#1e1e20] w-5 h-5 flex items-center justify-center bg-[#eae5d8] border border-[#2b2b2e] rounded-full shrink-0 mt-0.5">
                  2
                </span>
                <div className="text-xs text-[#35353a] leading-snug">
                  <span className="font-sketch font-bold text-sm text-[#1e1e20] block mb-0.5">
                    Tap "Add to Home Screen"
                  </span>
                  Scroll down the share sheet actions and tap{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-[#f0ebd9] border border-[#2b2b2e]/40 rounded text-[11px] font-mono-nums">
                    <PlusSquare className="w-3 h-3 inline mr-1 text-[#2b2b2e]" />
                    Add to Home Screen
                  </span>
                  .
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 bg-[#ffffff] border border-[#2b2b2e]/30 rounded-md flex items-start gap-2.5">
                <span className="font-sketch font-bold text-sm text-[#1e1e20] w-5 h-5 flex items-center justify-center bg-[#eae5d8] border border-[#2b2b2e] rounded-full shrink-0 mt-0.5">
                  3
                </span>
                <div className="text-xs text-[#35353a] leading-snug">
                  <span className="font-sketch font-bold text-sm text-[#1e1e20] block mb-0.5">
                    Tap "Add" in Top-Right
                  </span>
                  Tap <strong className="font-bold text-[#0284c7]">"Add"</strong> in the top-right corner.
                  Urban Run will appear as an app icon with the pencil runner icon!
                </div>
              </div>

              {/* iOS Safari Tip */}
              <div className="p-2 bg-[#f0ebd9]/70 border border-[#2b2b2e]/20 rounded text-[11px] text-[#55555c] leading-tight">
                💡 <strong className="font-semibold text-[#2b2b2e]">Note:</strong> Apple iOS requires Safari to add PWAs to the Home Screen. If opened inside Instagram, Gmail, or another app, tap the Safari icon in the corner to open in Safari first.
              </div>
            </div>
          )}

          {/* Benefits Feature Badges */}
          <div className="mt-3.5 pt-3 border-t border-[#2b2b2e]/20 grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 bg-[#ffffff] border border-[#2b2b2e]/20 rounded flex flex-col items-center justify-center">
              <Maximize2 className="w-3.5 h-3.5 text-[#2b2b2e] mb-1" />
              <span className="text-[10px] font-sketch font-bold text-[#1e1e20] leading-none">
                Full Screen
              </span>
              <span className="text-[9px] text-[#64748b]">No URL bar</span>
            </div>

            <div className="p-1.5 bg-[#ffffff] border border-[#2b2b2e]/20 rounded flex flex-col items-center justify-center">
              <WifiOff className="w-3.5 h-3.5 text-[#0284c7] mb-1" />
              <span className="text-[10px] font-sketch font-bold text-[#1e1e20] leading-none">
                100% Offline
              </span>
              <span className="text-[9px] text-[#64748b]">Play anytime</span>
            </div>

            <div className="p-1.5 bg-[#ffffff] border border-[#2b2b2e]/20 rounded flex flex-col items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-amber-600 mb-1" />
              <span className="text-[10px] font-sketch font-bold text-[#1e1e20] leading-none">
                Instant Load
              </span>
              <span className="text-[9px] text-[#64748b]">No App Store</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
