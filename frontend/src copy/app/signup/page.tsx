import { redirectToHome } from "@/lib/auth";
import SignupPage from "./SignupPage";

export default async function SignupPageServer() {
    await redirectToHome();
    return <SignupPage />;
}
