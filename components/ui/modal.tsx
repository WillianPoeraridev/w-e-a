"use client";

import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal accessible modal: Escape + intentional backdrop click to close, scroll lock.
 *
 * The backdrop only closes when the press BOTH started and ended on the backdrop
 * itself. This kills the classic "modal closes by itself" bug where you start a
 * drag/selection inside (or interact with a native <select>/date picker) and the
 * pointer is released over the backdrop — which would otherwise fire a click on it.
 * Every modal in the app goes through this component, so the guard is the default.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  // Was the pointer pressed down directly on the backdrop (not on the dialog)?
  const pressedOnBackdrop = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onPointerDown={(e) => {
        pressedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedOnBackdrop.current) {
          onClose();
        }
        pressedOnBackdrop.current = false;
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl border bg-card p-5 shadow-xl sm:rounded-2xl",
          "max-h-[92dvh] overflow-y-auto",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        <div className={cn(title && "mt-4")}>{children}</div>
      </div>
    </div>
  );
}
