import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  SunMedium, 
  RefreshCw, 
  FileQuestion, 
  ChevronLeft, 
  ChevronRight 
} from './icons';

interface ImageViewerProps {
  src: string;
  alt?: string;
  pageCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ 
  src, 
  alt = 'Invoice Bill Scan',
  pageCount = 1,
  currentPage = 1,
  onPageChange
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [invertColors, setInvertColors] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; dist?: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setHighContrast(false);
    setInvertColors(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Touch Support for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      touchStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      };
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - touchStartRef.current.x,
        y: touch.clientY - touchStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchStartRef.current.dist) {
      // Pinch to zoom
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartRef.current.dist;
      if (Math.abs(factor - 1) > 0.05) {
        setScale((prev) => Math.min(Math.max(prev * (factor > 1 ? 1.05 : 0.95), 0.5), 4));
        touchStartRef.current.dist = currentDist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.dist = undefined;
  };

  // Build CSS filter string
  const filterStyle = [
    highContrast ? 'contrast(180%) brightness(110%) grayscale(100%)' : '',
    invertColors ? 'invert(100%)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="relative flex flex-col h-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-colors duration-150">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center space-x-1 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400 px-1 min-w-[36px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
          <button
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHighContrast(!highContrast)}
            title="Thermal Receipt High-Contrast Filter"
            className={`p-1.5 rounded-lg transition-colors ${
              highContrast
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SunMedium className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
          <button
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-Page Navigation Controls */}
        {pageCount > 1 && (
          <div className="flex items-center space-x-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 px-1">
              Page {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage >= pageCount}
              className="p-1 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white disabled:opacity-30 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {highContrast && (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md pointer-events-auto">
            Thermal Contrast Mode
          </span>
        )}
      </div>

      {/* Main Pan/Zoom Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative flex-1 w-full h-full overflow-hidden image-canvas-container flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {src ? (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="flex items-center justify-center max-w-full max-h-full p-4 pointer-events-none"
          >
            <img
              src={src}
              alt={alt}
              style={{ filter: filterStyle }}
              className="max-w-none rounded-lg shadow-2xl transition-all duration-150 select-none object-contain max-h-[80vh]"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-center p-8 text-slate-400 dark:text-slate-600 space-y-3">
            <FileQuestion className="w-12 h-12 mx-auto opacity-50" />
            <p className="text-xs font-semibold">No Document Scan Available</p>
            <p className="text-[11px] max-w-xs mx-auto">
              Waiting for WhatsApp bill image upload or direct file drag & drop.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
