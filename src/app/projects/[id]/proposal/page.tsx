import { ProposalForm } from "@/components/proposals/ProposalForm";

export default function ProposalPage({
  params
}: {
  params: { id: string };
}) {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Submit Proposal
      </h1>

      <ProposalForm
        projectId={params.id}
        currency="USD"
        mode="create"
      />
    </div>
  );
}