import { getUserId } from "@/lib/auth/session";
import { paths } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const userId = await getUserId();
  if (!userId) {
    redirect(paths.auth.signIn);
  }

  redirect(paths.dashboard);
}
