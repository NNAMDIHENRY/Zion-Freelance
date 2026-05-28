import { JobModerationTable } from "@/components/admin/JobModerationTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { listAdminJobs, listPendingModerationJobs } from "@/lib/admin/jobs/service";

export const metadata = { title: "Jobs | Admin" };

export default async function AdminJobsPage() {
  const [pending, all] = await Promise.all([
    listPendingModerationJobs(),
    listAdminJobs({ page: 1, pageSize: 30 })
  ]);

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Job board moderation"
        description="Approve, reject, or feature job postings."
      />
      <section>
        <h2 className="mb-4 text-lg font-semibold">Pending approval ({pending.items.length})</h2>
        <JobModerationTable rows={pending.items} />
      </section>
      <section>
        <h2 className="mb-4 text-lg font-semibold">All jobs</h2>
        <JobModerationTable rows={all.items} />
      </section>
    </div>
  );
}
