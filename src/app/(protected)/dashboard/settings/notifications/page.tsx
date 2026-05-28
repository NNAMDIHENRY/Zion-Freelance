import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export default function NotificationSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notification settings</h1>
        <p className="text-sm text-muted-foreground">
          Choose how you want to be notified across the platform.
        </p>
      </div>
      <NotificationPreferencesPanel />
    </div>
  );
}
