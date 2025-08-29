import { getUserId } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const userId = await getUserId();
  if (!userId) {
    redirect("/sign-in");
  }

  redirect("/dashboard");
}
