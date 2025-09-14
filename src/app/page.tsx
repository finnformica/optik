import { getSession } from "@/lib/auth/session";
import { paths } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();

  if (!session) redirect(paths.home);

  redirect(paths.dashboard);
}
