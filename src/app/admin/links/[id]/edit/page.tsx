import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFullAdmin } from "@/lib/admin";
import EditLinkForm from "./EditLinkForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLinkPage({ params }: PageProps) {
  await requireFullAdmin();
  const { id } = await params;

  const link = await prisma.link.findUnique({
    where: { id },
  });

  if (!link) {
    notFound();
  }

  return <EditLinkForm link={link} />;
}
