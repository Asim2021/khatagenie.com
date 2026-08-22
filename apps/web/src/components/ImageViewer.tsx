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
} from 'lucide-react';


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
    if (e.button !== 0) return; // primary button only
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

  // Build CSS filter string
  const filterStyle = [
    highContrast ? 'contrast(180%) brightness(110%) grayscale(100%)' : '',
    invertColors ? 'invert(100%)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="relative flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-xl pointer-events-auto">
          <button
            onClick={handleZoomIn}
            title="Zoom In (Wheel Up)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-medium text-slate-400 px-1 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            title="Zoom Out (Wheel Down)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHighContrast(!highContrast)}
            title="Thermal Receipt High-Contrast Filter"
            className={`p-1.5 rounded transition-colors ${
              highContrast
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <SunMedium className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            onClick={handleReset}
            title="Reset View"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-Page Navigation Controls */}
        {pageCount > 1 && (
          <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-xl pointer-events-auto">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-semibold text-emerald-400 px-1">
              Page {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(pageCount, currentPage + 1))}
              disabled={currentPage >= pageCount}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {highContrast && (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg pointer-events-auto">
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
        onWheel={handleWheel}
        className="relative flex-1 w-full h-full overflow-hidden image-canvas-container flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      >
        {src ? (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="origin-center will-change-transform"
          >
            <img
              src={src}
              alt={alt}
              style={{ filter: filterStyle }}
              className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none border border-slate-800/60"
              onError={(e) => {
                // Fallback placeholder image if local upload not found
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="text-center p-8 text-slate-500">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-medium">No invoice bill scan attached</p>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>Click & drag to pan | Scroll to zoom</span>
        <span className="font-mono">Rotation: {rotation}°</span>
      </div>
    </div>
  );
};

