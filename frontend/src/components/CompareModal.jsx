import React from "react";
import Modal from "./Modal";
import ComparisonPanel from "./ComparisonPanel";
import MultiLocationPanel from "./MultiLocationPanel";

export default function CompareModal({ open, onClose, data, compareData }) {
  return (
    <Modal open={open} onClose={onClose} title="Compare designs">
      {data && (
        <div className="space-y-8">
          <ComparisonPanel data={data} />
          <div className="pt-6 border-t border-line">
            <MultiLocationPanel data={data} compareData={compareData} />
          </div>
        </div>
      )}
    </Modal>
  );
}
