import { requireAdmin } from "@/lib/admin";
import NewLinkForm from "./NewLinkForm";

export default async function NewLinkPage() {
  await requireAdmin();
  return <NewLinkForm />;
}
