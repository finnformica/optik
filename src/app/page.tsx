import { getUser } from "@/lib/supabase/server";
import { paths } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUser();

  if (!user) redirect(paths.home);

  redirect(paths.dashboard);
}
