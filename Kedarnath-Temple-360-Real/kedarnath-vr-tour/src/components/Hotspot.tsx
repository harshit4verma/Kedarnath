import React from 'react';
import type { InfoHotspot } from '../data/tourNodes';
import { X, Sparkles, MapPin, Volume2 } from 'lucide-react';

interface HotspotProps {
  hotspot: InfoHotspot | null;
  onClose: () => void;
  onChime?: () => void;
}

export const Hotspot: React.FC<HotspotProps> = ({ hotspot, onClose, onChime }) => {
  if (!hotspot) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-950/90 text-slate-100 shadow-2xl shadow-amber-500/10 backdrop-blur-xl transition-all duration-300 transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{hotspot.badge}</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {hotspot.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close Darshan (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 pt-1 space-y-4">
          {hotspot.image && (
            <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-inner bg-black/40 max-h-52">
              <img
                src={hotspot.image}
                alt={hotspot.title}
                className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 left-3 text-xs text-amber-200/80 flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5" />
                Kedarnath Dham Sanctum Complex
              </div>
            </div>
          )}

          <p className="text-sm leading-relaxed text-slate-300 font-light">
            {hotspot.description}
          </p>

          <div className="pt-2 flex items-center justify-between border-t border-white/10">
            <span className="text-xs text-amber-400/75 italic font-serif">
              ।। हर हर महादेव • ॐ नमः शिवाय ।।
            </span>
            <div className="flex items-center gap-2">
              {onChime && (
                <button
                  onClick={onChime}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition-colors"
                  title="Ring Sacred Bell Chime"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Ring Bell
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                Close Darshan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};