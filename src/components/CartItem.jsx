import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatCurrency';

export function CartItem({ item, onUpdateQty, onRemove }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200/80 dark:border-neutral-800 text-neutral-900 dark:text-white">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs truncate">{item.name}</div>
        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
          {formatCurrency(item.price)}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onUpdateQty(item.id, -1)}
          className="w-6 h-6 rounded-md bg-neutral-200/80 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
        >
          <Minus size={12} />
        </button>

        <span className="w-5 text-center text-xs font-bold font-mono">
          {item.qty}
        </span>

        <button
          onClick={() => onUpdateQty(item.id, 1)}
          className="w-6 h-6 rounded-md bg-neutral-200/80 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 flex items-center justify-center text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
        >
          <Plus size={12} />
        </button>

        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 rounded-md text-neutral-400 hover:text-rose-600 flex items-center justify-center transition-colors ml-1 cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
