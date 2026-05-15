"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmOptions = {
  variant: "confirm";
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type FormOptions = {
  variant: "form";
  title: string;
  description?: string;
  body: React.ReactNode;
  footer?: React.ReactNode;
};

type CustomOptions = {
  variant: "custom";
  body: React.ReactNode;
};

export type OpenModalOptions = ConfirmOptions | FormOptions | CustomOptions;

type ModalContextValue = {
  openModal: (options: OpenModalOptions) => void;
  closeModal: () => void;
};

const ModalContext = React.createContext<ModalContextValue | null>(null);

export function useDashboardModal() {
  const ctx = React.useContext(ModalContext);
  if (!ctx) {
    throw new Error("useDashboardModal must be used within DashboardModalProvider");
  }
  return ctx;
}

export function DashboardModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<OpenModalOptions | null>(null);
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = React.useState(false);

  const closeModal = React.useCallback(() => {
    setState(null);
    setBusy(false);
  }, []);

  const openModal = React.useCallback((options: OpenModalOptions) => {
    setState(options);
  }, []);

  React.useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (state) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [state]);

  const onDialogClose = React.useCallback(() => {
    setState(null);
    setBusy(false);
  }, []);

  const value = React.useMemo(
    () => ({
      openModal,
      closeModal
    }),
    [openModal, closeModal]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        onClose={onDialogClose}
        className={cn(
          "fixed left-1/2 top-1/2 z-[100] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-background p-0 shadow-subtle [&::backdrop]:bg-black/50",
          "open:animate-in open:fade-in-0 open:zoom-in-95"
        )}
      >
        {state?.variant === "confirm" ? (
          <div className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">{state.title}</h2>
            {state.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{state.description}</p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeModal} disabled={busy}>
                {state.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await state.onConfirm();
                    closeModal();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {state.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        ) : null}

        {state?.variant === "form" ? (
          <div className="flex max-h-[min(80vh,32rem)] flex-col">
            <div className="border-b border-border/60 px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">{state.title}</h2>
              {state.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{state.description}</p>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">{state.body}</div>
            {state.footer ? (
              <div className="border-t border-border/60 px-6 py-4">{state.footer}</div>
            ) : null}
          </div>
        ) : null}

        {state?.variant === "custom" ? <div className="p-6">{state.body}</div> : null}
      </dialog>
    </ModalContext.Provider>
  );
}