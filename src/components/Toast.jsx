import React, { useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { TOAST_DURATION } from '../utils/constants';

export function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-3 rounded-xl shadow-2xl border border-neutral-800 dark:border-neutral-200 flex items-center gap-3 antialiased">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        isSuccess ? 'bg-emerald-500/20 text-emerald-400 dark:text-emerald-600' :
        isError ? 'bg-rose-500/20 text-rose-400 dark:text-rose-600' :
        'bg-neutral-500/20 text-neutral-400'
      }`}>
        {isSuccess ? <Check size={12} strokeWidth={2.5} /> :
         isError ? <AlertCircle size={12} strokeWidth={2.5} /> :
         <Info size={12} strokeWidth={2.5} />}
      </div>

      <span className="flex-1 text-xs font-medium leading-relaxed">
        {message}
      </span>

      <button
        onClick={onClose}
        className="p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
