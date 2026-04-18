import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const host = (await headers()).get("host")?.toLowerCase() ?? "";

  if (host.includes("admin")) {
    redirect("/admin/login");
  }

  redirect("/auth");
}
