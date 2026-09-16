import React, { useState } from 'react';
import type { TourNode } from '../data/tourNodes';
import { TOUR_NODES } from '../data/tourNodes';
import { 
  Volume2, VolumeX, Compass, Glasses, 
  HelpCircle, X
} from 'lucide-react';

interface HUDProps {
  currentNode: TourNode;
  currentYaw: number;
  currentPitch: number;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  onNavigate: (nodeId: string) => void;
  isGyroActive: boolean;
  onToggleGyro: () => void;
  onEnterVR?: () => void;
  hasVRSupport?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  currentNode,
  currentYaw,
  isAudioPlaying,
  onToggleAudio,
  onNavigate,
  isGyroActive,
  onToggleGyro,
  onEnterVR,
  hasVRSupport = true,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Nodes list for the bottom quick carousel
  const nodeList = Object.values(TOUR_NODES);

  return (
    <>
      {/* 1. TOP HEADER BAR */}
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between p-3 sm:p-5 pointer-events-none">
        {/* Title & Active Location */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="rounded-2xl border border-white/15 bg-slate-950/70 p-3 backdrop-blur-xl shadow-2xl flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              ॐ
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase font-serif">
                  ।। श्री केदारनाथ धाम ।।
                </span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                {currentNode.title}
              </h1>
              <p className="text-[11px] text-slate-400 font-light hidden sm:block">
                {currentNode.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Audio Ambience Button */}
          <button
            onClick={onToggleAudio}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-xl transition-all shadow-lg ${
              isAudioPlaying
                ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 shadow-amber-500/10'
                : 'border-white/15 bg-slate-950/70 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Authentic Aarti & Himalayan Wind Audio"
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">Aarti Audio</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Audio Off</span>
              </>
            )}
          </button>

          {/* Mobile Gyroscope DeviceOrientation Toggle */}
          <button
            onClick={onToggleGyro}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold backdrop-blur-xl transition-all shadow-lg ${
              isGyroActive
                ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-300 shadow-cyan-500/10'
                : 'border-white/15 bg-slate-950/70 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Gyroscope Device Orientation Look"
          >
            <Compass className={`w-4 h-4 ${isGyroActive ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Gyro</span>
          </button>

          {/* WebXR VR Mode */}
          {hasVRSupport && onEnterVR && (
            <button
              onClick={onEnterVR}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 px-3.5 py-2 text-xs font-bold text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 backdrop-blur-xl transition-all cursor-pointer"
              title="Enter WebXR Immersive VR Mode"
            >
              <Glasses className="w-4 h-4" />
              <span>Enter VR</span>
            </button>
          )}

          {/* Help / Controls Guide */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="rounded-xl border border-white/15 bg-slate-950/70 p-2 text-slate-300 hover:text-white hover:bg-white/10 backdrop-blur-xl transition-all shadow-lg cursor-pointer"
            title="How to Navigate"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. INTERACTIVE RADAR MINIMAP (Bottom-Left) */}
      <div className="fixed bottom-24 sm:bottom-28 left-4 z-30 pointer-events-auto">
        <div 
          className={`relative rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-xl shadow-2xl p-2.5 transition-all duration-300 ${
            isMapExpanded ? 'w-64 h-64' : 'w-44 h-44 sm:w-48 sm:h-48'
          }`}
        >
          {/* Header title on map */}
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300/90 tracking-wide uppercase">
              <Compass className="w-3 h-3 text-amber-400" />
              <span>Campus Radar</span>
            </div>
            <button
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer"
              title="Toggle radar size"
            >
              {isMapExpanded ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {/* Blueprint SVG Map Container */}
          <div className="relative w-full h-[calc(100%-24px)] rounded-xl overflow-hidden border border-white/10 bg-slate-900/90">
            {/* Compass North Arrow */}
            <div className="absolute top-1.5 right-2 flex flex-col items-center pointer-events-none z-20">
              <span className="text-[9px] font-black text-red-500">N</span>
              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[6px] border-b-red-500" />
            </div>

            {/* Schematic Campus Drawing */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Background mountain ridge at North */}
              <path
                d="M 5,12 L 25,4 L 45,8 L 65,2 L 85,7 L 95,14 L 95,20 L 5,20 Z"
                fill="rgba(148, 163, 184, 0.15)"
                stroke="rgba(148, 163, 184, 0.3)"
                strokeWidth="0.75"
              />
              <text x="50" y="10" fontSize="3.5" fill="rgba(248, 250, 252, 0.6)" textAnchor="middle" fontWeight="bold">
                KEDAR MASSIF (6,831m)
              </text>

              {/* Bhim Shila Boulder behind temple */}
              <ellipse cx="50" cy="25" rx="5" ry="3.5" fill="rgba(100, 116, 139, 0.4)" stroke="rgba(203, 213, 225, 0.6)" strokeWidth="0.8" />
              <text x="50" y="26" fontSize="2.8" fill="rgba(254, 240, 138, 0.9)" textAnchor="middle">
                Bhim Shila
              </text>

              {/* Kedarnath Temple Footprint */}
              <rect x="42" y="34" width="16" height="24" rx="1.5" fill="rgba(217, 119, 6, 0.25)" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="1" />
              {/* Shikhara Tower Square */}
              <rect x="44" y="35" width="12" height="10" fill="rgba(245, 158, 11, 0.4)" stroke="rgba(251, 191, 36, 1)" strokeWidth="0.8" />
              {/* Mandapa Gabled Roof */}
              <rect x="43" y="46" width="14" height="11" fill="rgba(234, 179, 8, 0.2)" stroke="rgba(245, 158, 11, 0.7)" strokeWidth="0.7" />
              <text x="50" y="42" fontSize="3" fill="#fef08a" textAnchor="middle" fontWeight="bold">
                TEMPLE
              </text>

              {/* Central Stone Walkway (South) */}
              <rect x="45" y="60" width="10" height="35" fill="rgba(148, 163, 184, 0.25)" stroke="rgba(148, 163, 184, 0.5)" strokeWidth="0.6" strokeDasharray="1.5,1.5" />
              <text x="50" y="80" fontSize="2.5" fill="rgba(203, 213, 225, 0.7)" textAnchor="middle">
                Yatra Path
              </text>

              {/* Eastern Township / Ashrams block */}
              <rect x="68" y="42" width="18" height="26" rx="1" fill="rgba(30, 58, 138, 0.2)" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="0.6" />
              <text x="77" y="55" fontSize="2.8" fill="rgba(147, 197, 253, 0.8)" textAnchor="middle">
                Ashrams
              </text>

              {/* Western Flood Wall */}
              <path d="M 28,30 Q 25,50 30,70" fill="none" stroke="rgba(148, 163, 184, 0.7)" strokeWidth="1.2" strokeDasharray="2,1" />

              {/* Dynamic Rotating Vision Cone / Radar Beam for Active Node */}
              {(() => {
                const { x, y } = currentNode.mapCoords;
                const angleRad = ((-currentYaw + 180) * Math.PI) / 180;
                const fovHalf = (35 * Math.PI) / 180;
                const length = 22;

                const leftAngle = angleRad - fovHalf;
                const rightAngle = angleRad + fovHalf;

                const lx = x + Math.sin(leftAngle) * length;
                const ly = y - Math.cos(leftAngle) * length;
                const rx = x + Math.sin(rightAngle) * length;
                const ry = y - Math.cos(rightAngle) * length;

                return (
                  <g className="pointer-events-none">
                    {/* Vision Sector */}
                    <path
                      d={`M ${x},${y} L ${lx},${ly} A ${length} ${length} 0 0 1 ${rx},${ry} Z`}
                      fill="url(#radarGrad)"
                      stroke="rgba(245, 158, 11, 0.5)"
                      strokeWidth="0.5"
                    />
                    <line x1={x} y1={y} x2={x + Math.sin(angleRad) * (length + 4)} y2={y - Math.cos(angleRad) * (length + 4)} stroke="#f59e0b" strokeWidth="0.8" />
                  </g>
                );
              })()}

              {/* Gradients */}
              <defs>
                <radialGradient id="radarGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${currentNode.mapCoords.x}, ${currentNode.mapCoords.y}) scale(22)`}>
                  <stop offset="0%" stopColor="rgba(245, 158, 11, 0.55)" />
                  <stop offset="70%" stopColor="rgba(245, 158, 11, 0.15)" />
                  <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                </radialGradient>
              </defs>

              {/* Interactive Node Dots */}
              {nodeList.map((node) => {
                const isActive = node.id === currentNode.id;
                return (
                  <g
                    key={node.id}
                    onClick={() => onNavigate(node.id)}
                    className="cursor-pointer transition-transform hover:scale-125"
                  >
                    {isActive ? (
                      <>
                        {/* Outer Pulse Ring */}
                        <circle
                          cx={node.mapCoords.x}
                          cy={node.mapCoords.y}
                          r="5"
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="0.8"
                          className="animate-ping"
                        />
                        {/* Core Dot */}
                        <circle
                          cx={node.mapCoords.x}
                          cy={node.mapCoords.y}
                          r="3"
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                      </>
                    ) : (
                      <circle
                        cx={node.mapCoords.x}
                        cy={node.mapCoords.y}
                        r="2.2"
                        fill="rgba(248, 250, 252, 0.8)"
                        stroke="rgba(15, 23, 42, 0.9)"
                        strokeWidth="0.6"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM NODE QUICK-CAROUSEL DOCK */}
      <footer className="fixed bottom-3 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full rounded-2xl border border-white/15 bg-slate-950/75 p-2 backdrop-blur-xl shadow-2xl pointer-events-auto scrollbar-none">
          {nodeList.map((node, idx) => {
            const isActive = node.id === currentNode.id;
            return (
              <button
                key={node.id}
                onClick={() => onNavigate(node.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title={node.subtitle}
              >
                <span className="text-sm">
                  {idx === 0 && '🚶'}
                  {idx === 1 && '🐂'}
                  {idx === 2 && '🏛️'}
                  {idx === 3 && '🚩'}
                  {idx === 4 && '🪨'}
                  {idx === 5 && '🏔️'}
                </span>
                <span>{node.title.replace('Shri ', '').replace('Miraculous ', '')}</span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* 4. HELP / NAVIGATION GUIDE MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-950/90 p-6 text-slate-100 shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">How to Explore 360° Kedarnath</h3>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <strong className="text-amber-300 block mb-1 text-sm">360° Walkthrough Navigation:</strong>
                <p>Click or tap the <strong>animated ground chevrons (arrows)</strong> to walk forward/backward between viewpoints with smooth Google Street View transitions.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <strong className="text-amber-300 block mb-1 text-sm">Desktop Controls:</strong>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Click and Drag</strong>: Look around 360 degrees.</li>
                  <li><strong>WASD / Arrow Keys</strong>: Step forward/backward to nearest nodes.</li>
                  <li><strong>Scroll Wheel</strong>: Zoom in and out.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <strong className="text-amber-300 block mb-1 text-sm">Mobile and VR:</strong>
                <p>Drag with your finger to look. Tap <strong>Gyro</strong> to look around naturally by tilting your phone. Tap <strong>Enter VR</strong> for WebXR headsets.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <strong className="text-amber-300 block mb-1 text-sm">Landmark Beacons:</strong>
                <p>Click the floating glowing beacons above Nandi, Temple facade, and Bhim Shila to view authentic historical details.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Start Pilgrimage
            </button>
          </div>
        </div>
      )}
    </>
  );
};