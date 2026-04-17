import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") qs.set(key, value);
  }
  const query = qs.toString();
  redirect(query ? `/auth/signin?${query}` : "/auth/signin");
}
