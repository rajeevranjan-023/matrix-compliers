import React from "react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-panel border border-line rounded-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-slate-100 text-xl leading-none px-2">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
