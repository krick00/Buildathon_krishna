import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSessionUser } from "@/lib/auth/currentUser";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/home");
  return <AuthForm mode="login" />;
}
