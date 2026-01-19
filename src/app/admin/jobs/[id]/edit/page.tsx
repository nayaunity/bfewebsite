import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditJobForm from "./EditJobForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
  const { id } = await params;

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    notFound();
  }

  return <EditJobForm job={job} />;
}
