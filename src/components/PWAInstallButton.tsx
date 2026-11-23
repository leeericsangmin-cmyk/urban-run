import React, { useState } from 'react';
import { Download, Share, X, CheckCircle, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'menu' | 'compact' | 'header';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'menu' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed in standalone mode, do not show button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  // Success indicator
  if (installSuccess) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border-2 border-emerald-700 text-emerald-800 rounded-lg text-xs font-sketch font-bold animate-in fade-in">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <span>APP INSTALLED!</span>
      </div>
    );
  }

  // 1. Android / Chromium / Desktop install prompt available
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="Install Urban Run"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-sketch font-bold text-[#202024] bg-[#eae5d8] hover:bg-[#ded7c8] active:bg-[#d0c8b6] rounded border border-[#2b2b2e] transition-all cursor-pointer active:scale-95"
          title="Install as Progressive Web App"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Install</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install Urban Run on this device"
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#faf8f3] hover:bg-[#ede8dc] active:bg-[#dfd9cc] text-[#242426] font-sketch font-bold text-sm sm:text-base rounded-lg border-2 border-[#2b2b2e] shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95 group"
      >
        <Smartphone className="w-4 h-4 text-[#242426] transition-transform group-hover:scale-110" />
        <span>INSTALL APP</span>
        <span className="text-[10px] font-mono-nums font-semibold px-1.5 py-0.5 bg-[#2b2b2e] text-white rounded">
          PWA
        </span>
      </button>
    );
  }

  // 2. iOS Safari helper (WebKit doesn't trigger beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        {variant === 'compact' ? (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            aria-label="Install guide for iOS"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-sketch font-bold text-[#202024] bg-[#eae5d8] hover:bg-[#ded7c8] active:bg-[#d0c8b6] rounded border border-[#2b2b2e] transition-all cursor-pointer"
            title="How to install on iOS"
          >
            <Share className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            aria-label="Install on iPhone / iPad"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-[#faf8f3] hover:bg-[#ede8dc] text-[#242426] font-sketch font-bold text-sm rounded-lg border-2 border-[#2b2b2e] shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Share className="w-4 h-4 text-[#0284c7]" />
            <span>INSTALL ON IOS</span>
          </button>
        )}

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2b2b2e]/60 backdrop-blur-xs select-none">
            <div className="w-full max-w-sm bg-[#ffffff] border-4 border-[#2b2b2e] p-6 rounded-lg shadow-2xl relative text-left">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close iOS install guide"
                className="absolute top-4 right-4 p-1 text-[#2b2b2e] hover:bg-[#ede9df] rounded border border-[#2b2b2e]/30"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-sketch text-2xl font-bold text-[#1e1e20] mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#0284c7]" />
                <span>Install on iPhone / iPad</span>
              </h3>

              <div className="space-y-3 text-xs text-[#404045] mt-3">
                <p className="text-xs text-[#242426] font-semibold bg-[#f0ebd9] p-2.5 rounded border border-[#2b2b2e]/30">
                  To install: Tap the Share icon in Safari, then select 'Add to Home Screen'.
                </p>

                <div className="p-2.5 bg-[#faf8f3] border-2 border-[#2b2b2e] rounded-md flex items-center gap-2.5">
                  <span className="font-sketch font-bold text-base text-[#1e1e20] px-2 py-0.5 bg-[#eae5d8] border border-[#2b2b2e] rounded">
                    1
                  </span>
                  <div>
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-[#0284c7]" /> at the bottom of Safari.
                  </div>
                </div>

                <div className="p-2.5 bg-[#faf8f3] border-2 border-[#2b2b2e] rounded-md flex items-center gap-2.5">
                  <span className="font-sketch font-bold text-base text-[#1e1e20] px-2 py-0.5 bg-[#eae5d8] border border-[#2b2b2e] rounded">
                    2
                  </span>
                  <div>
                    Scroll down and tap <strong>"Add to Home Screen"</strong>.
                  </div>
                </div>

                <div className="p-2.5 bg-[#faf8f3] border-2 border-[#2b2b2e] rounded-md flex items-center gap-2.5">
                  <span className="font-sketch font-bold text-base text-[#1e1e20] px-2 py-0.5 bg-[#eae5d8] border border-[#2b2b2e] rounded">
                    3
                  </span>
                  <div>
                    Tap <strong>"Add"</strong> in the top-right corner to finish.
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2 bg-[#2b2b2e] text-white font-sketch text-sm font-bold rounded-lg border-2 border-[#2b2b2e] hover:bg-[#1a1a1c] transition-colors"
                >
                  GOT IT
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
