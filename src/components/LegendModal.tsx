import React from 'react';
import { X } from 'lucide-react';
import { TaxiIcon, EBikeIcon, CrowdIcon } from './ObstacleIcons';

interface LegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegendModal: React.FC<LegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-[#2b2b2e]/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#ffffff] border-4 border-[#2b2b2e] p-5 sm:p-6 rounded-lg shadow-xl relative">
        <button
          onClick={onClose}
          aria-label="Close guide"
          className="absolute top-4 right-4 p-1 rounded hover:bg-[#ede9df] text-[#2b2b2e] border border-[#2b2b2e]/30"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-sketch text-2xl font-bold text-[#1e1e20] mb-4 pb-2 border-b border-[#2b2b2e]/20">
          FIELD SKETCH GUIDE · NYC
        </h3>

        <div className="space-y-4 text-xs text-[#3a3a40]">
          <div>
            <h4 className="font-sketch font-bold text-sm text-[#1e1e20] mb-1.5 uppercase tracking-wide">
              HAZARDS & RULES
            </h4>
            <div className="space-y-2">
              <div className="p-3 border-2 border-[#2b2b2e] bg-[#faf8f3] rounded flex items-start gap-3">
                <span className="text-2xl">🌧️</span>
                <div>
                  <div className="font-bold text-sm text-[#dc2626]">Deadly Rainstorm (Bottom of Map)</div>
                  <p className="text-[#525258] mt-0.5">
                    A lethal rainstorm sweeps up steadily from the bottom of the map. Once the rainstorm touches the character, the game is over! Keep sprinting north.
                  </p>
                </div>
              </div>

              <div className="p-3 border-2 border-[#2b2b2e] bg-[#faf8f3] rounded flex items-start gap-3">
                <span className="text-2xl">🌊</span>
                <div>
                  <div className="font-bold text-sm text-[#0284c7]">Deadly Surrounding Rivers</div>
                  <p className="text-[#525258] mt-0.5">
                    Touching a river causes instant death! Stay on the streets
                  </p>
                </div>
              </div>

              <div className="p-3 border-2 border-[#2b2b2e] bg-[#faf8f3] rounded flex items-start gap-3">
                <div className="flex items-center gap-1.5 shrink-0 pt-0.5 p-1 bg-white border border-[#2b2b2e]/30 rounded shadow-2xs">
                  <TaxiIcon className="w-8 h-4.5" />
                  <EBikeIcon className="w-6 h-4.5" />
                  <CrowdIcon className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#b45309]">Obstacles</span>
                  </div>
                  <p className="text-[#525258] mt-0.5">
                    Do try avoiding taxi cabs, bikes, and crowds! They drain your health and slow you down!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-sketch font-bold text-sm text-[#1e1e20] mb-1.5 uppercase tracking-wide">
              OBJECTIVE & MAP
            </h4>
            <div className="p-2.5 border border-[#2b2b2e]/30 bg-[#faf8f3] rounded space-y-2">
              <p>
                <span className="font-bold text-[#1e1e20]">🗺️ NYC Map:</span> The dedicated map features 8th Ave, Broadway, 5th Ave, and continuous cross-streets.
              </p>
              <p>
                <span className="font-bold text-[#1e1e20]">🎮 Controls:</span> Swipe ⬆️ ⬇️ ⬅️ ➡️ anywhere on mobile, or use Arrow keys / WASD on computer.
              </p>
              <p>
                <span className="font-bold text-[#1e1e20]">⚡ High-Speed Sprint:</span> The stickman sprints continuously forward from the bottom center at an exhilarating pace.
              </p>
              <p>
                <span className="font-bold text-[#dc2626]">⚠️ Outrun the Rainstorm:</span> Never stop or linger! Navigate around taxis and buildings while staying ahead of the rising rainstorm front.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-[#2b2b2e] text-white font-sketch font-bold text-sm rounded border border-[#2b2b2e] hover:bg-[#1a1a1c]"
          >
            GOT IT, RESUME RUN
          </button>
        </div>
      </div>
    </div>
  );
};
