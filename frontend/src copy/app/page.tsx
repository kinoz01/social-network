import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Index() {
    await requireSession();
    // If we reach here, session is valid
    redirect("/home")
}
