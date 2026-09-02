import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, AlertOctagon } from 'lucide-react';
import { getImageUrl } from '../../api/client';

export default function ImageSlider({ beforeImage, afterImage, title = 'Waste Transformation' }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) handleMove(e.clientX);
  };

  const beforeSrc = getImageUrl(beforeImage);
  const afterSrc = getImageUrl(afterImage);

  // If afterImage is not available, render a single image preview
  if (!afterImage) {
    return (
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-800 shadow-xl group">
        <img
          src={beforeSrc}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute top-3 left-3 bg-rose-950/80 backdrop-blur-md border border-rose-500/30 text-rose-200 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-lg">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          Reported Condition
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden aspect-video select-none cursor-ew-resize border border-emerald-500/30 shadow-2xl bg-slate-900"
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Background: Cleaned / After Image */}
        <img
          src={afterSrc}
          alt="After Cleanup"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80';
          }}
        />

        {/* Foreground: Reported / Before Image (Clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeSrc}
            alt="Before Cleanup"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80';
            }}
          />
        </div>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 pointer-events-none bg-rose-950/80 backdrop-blur-md border border-rose-500/30 text-rose-200 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-lg">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          BEFORE
        </div>
        <div className="absolute top-3 right-3 pointer-events-none bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-200 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          AFTER CLEANUP
        </div>

        {/* Slider Divider Line & Thumb */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-8 h-8 -ml-4 bg-emerald-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-bold transition-transform group-hover:scale-110">
            ↔
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">
        Drag slider horizontally to compare before and after cleanup
      </p>
    </div>
  );
}
