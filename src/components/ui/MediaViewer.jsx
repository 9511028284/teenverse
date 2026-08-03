import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, ChevronLeft, ChevronRight, FileText, Loader2, ImageOff
} from 'lucide-react';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg|ico|heic|heif|jfif)$/i;

export const isImageUrl = (url = '') => {
  if (!url) return false;
  const cleaned = url.split('?')[0].toLowerCase();
  return IMAGE_EXT.test(cleaned);
};

export const getFileName = (url = '', fallback = 'Attachment') => {
  try {
    const parsed = new URL(url);
    const name = decodeURIComponent(parsed.pathname.split('/').pop() || '');
    return name && name.includes('.') ? name : fallback;
  } catch {
    const parts = url.split('/');
    const name = decodeURIComponent(parts[parts.length - 1] || '');
    return name && name.includes('.') ? name : fallback;
  }
};

const downloadBlob = async (url, name) => {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return false;
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = name || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
    return true;
  } catch {
    return false;
  }
};

const MediaViewer = ({ items = [], index = 0, onClose, onIndexChange }) => {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const safeIndex = Math.max(0, Math.min(index, items.length - 1));
  const current = items[safeIndex];
  const isImage = isImageUrl(current?.url);
  const hasMultiple = items.length > 1;

  useEffect(() => {
    setLoading(true);
    setImageError(false);
  }, [safeIndex, current?.url]);

  const goPrev = useCallback(() => {
    if (!hasMultiple) return;
    onIndexChange?.((i) => (i - 1 + items.length) % items.length);
  }, [onIndexChange, items.length, hasMultiple]);

  const goNext = useCallback(() => {
    if (!hasMultiple) return;
    onIndexChange?.((i) => (i + 1) % items.length);
  }, [onIndexChange, items.length, hasMultiple]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDownload = async () => {
    if (!current || downloading) return;
    setDownloading(true);
    const ok = await downloadBlob(current.url, getFileName(current.url));
    if (!ok) window.open(current.url, '_blank');
    setDownloading(false);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex flex-col"
        onClick={onClose}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <FileText size={15} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">{current?.name || 'Attachment'}</p>
              {hasMultiple && (
                <p className="text-[11px] text-white/50 font-medium">{safeIndex + 1} of {items.length}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60"
            >
              {downloading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} strokeWidth={2.5}/>}
              Download
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-16 py-4 min-h-0">
          {isImage ? (
            <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {loading && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-white/50" />
                </div>
              )}
              {imageError ? (
                <div className="flex flex-col items-center gap-3 text-white/60">
                  <ImageOff size={40} />
                  <p className="text-sm font-medium">Preview unavailable</p>
                  <button onClick={handleDownload} className="text-xs font-black uppercase tracking-wider text-white bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-colors">
                    Download instead
                  </button>
                </div>
              ) : (
                <img
                  src={current?.url}
                  alt={current?.name || 'Attachment preview'}
                  onLoad={() => setLoading(false)}
                  onError={() => { setLoading(false); setImageError(true); }}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <FileText size={28} className="text-white/80" />
                </div>
                <p className="text-white font-bold text-sm break-all">{current?.name || 'Attachment'}</p>
                <p className="text-white/50 text-xs font-medium mt-1.5">This file cannot be previewed inside the app.</p>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all disabled:opacity-60"
                >
                  {downloading ? <Loader2 size={14} className="animate-spin"/> : <Download size={14} strokeWidth={2.5}/>}
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        {hasMultiple && (
          <div className="flex items-center justify-center gap-3 pb-5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onIndexChange?.(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === safeIndex ? 'bg-white w-5' : 'bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default MediaViewer;
