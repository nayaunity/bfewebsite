import { requireFullAdmin } from "@/lib/admin";
import NewLinkForm from "./NewLinkForm";

export default async function NewLinkPage() {
  await requireFullAdmin();
  return <NewLinkForm />;
}
