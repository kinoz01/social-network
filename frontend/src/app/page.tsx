import { requireSession } from "@/lib/auth";
import { redirect } from "next/navigation";

// Server component runs on the edge / Node before any HTML is streamed.
export default async function Index() {
    await requireSession();
    // If we reach here, session is valid
    redirect("/home")
}
