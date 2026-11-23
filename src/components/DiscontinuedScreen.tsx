import React, { useEffect } from 'react';

/**
 * Permanent full-screen lockout screen displayed after the Remote Kill Switch
 * executes cleanup. Blocks all gameplay, menus, keyboard shortcuts, and navigation.
 */
export const DiscontinuedScreen: React.FC = () => {
  useEffect(() => {
    // Trap browser back/forward history navigation
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };

    // Block all keyboard shortcuts and navigation keys
    const handleKeydown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeydown, true);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeydown, true);
    };
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-[999999] bg-[#f8f6f0] text-[#1e1e20] flex items-center justify-center p-6 select-none"
    >
      <div className="w-full max-w-md bg-[#ffffff] border-4 border-[#2b2b2e] rounded-lg px-6 py-10 shadow-xl text-center">
        <p className="font-sketch text-2xl sm:text-3xl font-bold text-[#1e1e20] leading-snug">
          This application has been discontinued by the author.
        </p>
      </div>
    </div>
  );
};
