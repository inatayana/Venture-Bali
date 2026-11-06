'use client';

import { useRef, useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface SignaturePadProps {
  onSign: (svgBase64: string) => void;
  onClear: () => void;
  /** CSS width of the canvas — a number (px) or any CSS width string. */
  width?: number | string;
  height?: number;
  disabled?: boolean;
  className?: string;
}

export function SignaturePad({
  onSign,
  onClear,
  width = '100%',
  height = 200,
  disabled = false,
  className = '',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext('2d')?.scale(dpr, dpr);
  }, []);

  const getCanvasPoint = (e: React.PointerEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setStrokes([[point]]);
  };

  const draw = (e: React.PointerEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const point = getCanvasPoint(e);
    setStrokes((prev) => [...prev.slice(0, -1), [...prev[prev.length - 1], point]]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setStrokes([]);
    onClear();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;

    const svg = generateSVG();
    const base64 = btoa(svg);
    onSign(base64);
  };

  const generateSVG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return '';

    const paths = strokes.map(
      (stroke) =>
        `<polyline points="${stroke.map((p) => `${p.x},${p.y}`).join(' ')}" stroke="black" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    ).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">${paths}</svg>`;
  };

  // Render strokes on canvas in real-time
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach((stroke) => {
      ctx.beginPath();
      stroke.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  }, [strokes]);

  const handlePointerDown = (e: React.PointerEvent) => startDrawing(e);
  const handlePointerMove = (e: React.PointerEvent) => draw(e);
  const handlePointerUp = () => stopDrawing();
  const handlePointerLeave = () => stopDrawing();

  const handleTouchStart = (e: React.TouchEvent) => startDrawing(e);
  const handleTouchMove = (e: React.TouchEvent) => draw(e);
  const handleTouchEnd = () => stopDrawing();

  return (
    <div className={`border-2 border-neutral-300 rounded-lg bg-white ${className}`} style={{ width, touchAction: 'none' }}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none select-none"
          style={{ height, cursor: disabled ? 'not-allowed' : 'crosshair', touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {strokes.length === 0 && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-neutral-400 text-sm font-medium">
              {isMobile ? 'Tandatangani di sini dengan jari' : 'Tandatangani di sini dengan mouse'}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 p-3 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={disabled || strokes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <X className="h-4 w-4" />
            Hapus
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={saveSignature}
            disabled={disabled || strokes.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand bg-brand-ink rounded-lg hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-4 w-4" />
            Simpan Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  );
}