import { Suspense } from "react";

import { MessagesDashboard } from "@/components/messaging/MessagesDashboard";

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Hydrating messenger shell…</p>
      }
    >
      <MessagesDashboard />
    </Suspense>
  );
}
