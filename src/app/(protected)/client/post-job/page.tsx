import { redirect } from "next/navigation";

export default function ClientPostJobPage() {
  redirect("/dashboard/jobs/new");
}
