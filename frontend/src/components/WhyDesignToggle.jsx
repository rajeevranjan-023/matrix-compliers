import React, { useState } from "react";
import DesignPanel from "./DesignPanel";


export default function WhyDesignToggle({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!data}
        className="flex items-center gap-1.5 bg-panel2 border border-line text-slate-100 rounded-lg px-3 py-2 text-[12px] hover:border-amber disabled:opacity-50"
      >
        💡 Why this design? {open ? "▲" : "▼"}
      </button>
      {open && data && (
        <div className="mt-3">
          <DesignPanel data={data} />
        </div>
      )}
    </div>
  );
}
