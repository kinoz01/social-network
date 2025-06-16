import { redirectToHome } from "@/lib/auth";
import LoginPage from "./LoginPage";

export default async function LoginPageServer() {
    await redirectToHome(); // server-side redirect if already logged in
    return <LoginPage />; // render client component
}
