"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "ink" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {icon ? <div className="flex justify-start">{icon}</div> : null}
      <p className="text-[13.5px] leading-relaxed text-ink/70">
        This is a prototype action and can be undone from the same screen.
      </p>
    </Modal>
  );
}
