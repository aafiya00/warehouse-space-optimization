import React from "react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen, onClose, onConfirm,
  title = "Confirm Action",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
}) => {
  const btnColor = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-500 hover:bg-yellow-600",
    info: "bg-blue-600 hover:bg-blue-700",
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose}
          className="px-4 py-2 text-sm border rounded-md text-gray-700 hover:bg-gray-50">
          {cancelLabel}
        </button>
        <button onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 text-sm text-white rounded-md ${btnColor}`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
