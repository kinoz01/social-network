"use client";

import "@/styles/auth.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_URL } from "@/lib/api_url";

interface AuthModalProps {
    authSuccess: () => void; // called after successful auth
}

export default function AuthModal({ authSuccess }: AuthModalProps) {
    // route-aware view
    const router = useRouter();
    const pathname = usePathname();
    const [isLogin, setIsLogin] = useState(pathname !== "/signup");
    useEffect(() => setIsLogin(pathname !== "/signup"), [pathname]);

    // ui state
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [fileName, setFileName] = useState("Upload Image (optional)");
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        birthday: "",
        aboutMe: "",
        profilePic: null as File | null,
        accountType: "public"
    });

    // helpers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleAccountType = (t: "private" | "public") =>
        setFormData(p => ({ ...p, accountType: t }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return setFileName("Upload Image (optional)");
        setFileName(f.name.length > 60 ? f.name.slice(0, 60) + "..." : f.name);
        setFormData(p => ({ ...p, profilePic: f }));
    };

    // api
    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");

        const signupData = new FormData();
        signupData.append("email", formData.email);
        signupData.append("username", formData.username);
        signupData.append("password", formData.password);
        signupData.append("first_name", formData.firstName);
        signupData.append("last_name", formData.lastName);
        signupData.append("birthday", formData.birthday);
        signupData.append("about_me", formData.aboutMe);
        signupData.append("account_type", formData.accountType);
        if (formData.profilePic) signupData.append("profile_pic", formData.profilePic);

        try {
            const res = await fetch(`${API_URL}/api/signup`, {
                method: "POST",
                body: signupData,
                credentials: "include",
            });

            if (!res.ok) throw new Error((await res.json()).msg || "signup failed");

            localStorage.setItem("showWelcome", "true")
            await handleLogin(e)
        } catch (error: any) {
            setErrorMsg(error.message || "Signup failed.");
        }
    };


    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    login: formData.email,
                    password: formData.password
                }),
                credentials: "include",
            });
            if (!res.ok) throw new Error((await res.json()).msg);

            authSuccess()
        } catch (error: any) {
            setErrorMsg(error.message || "Login failed.");
        }
    };

    // submit button state
    const required = isLogin
        ? [formData.email, formData.password]
        : [formData.firstName, formData.lastName, formData.birthday, formData.email, formData.password];
    const submitDisabled = required.some(v => !v || !v.trim());

    // render
    return (
        <div className="modal">
            <div className="modal-dialog">
                <h2 className="modal-title">{isLogin ? "Log In" : "Sign Up"}</h2>

                <form className="auth-form" onSubmit={isLogin ? handleLogin : handleSignUp}>
                    {!isLogin && (
                        <>
                            <label>First Name <span>*</span></label>
                            <input
                                type="text"
                                name="firstName"
                                className="input-field"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                maxLength={16}
                                required
                            />

                            <label>Last Name <span>*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                className="input-field"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                maxLength={16}
                                required
                            />

                            <label>Birthday <span>*</span></label>
                            <input
                                type="date"
                                name="birthday"
                                className="input-field"
                                value={formData.birthday}
                                onChange={handleInputChange}
                                required
                            />

                            <label>About Me (optional)</label>
                            <textarea
                                name="aboutMe"
                                className="input-field about-me"
                                placeholder="A short bio"
                                value={formData.aboutMe}
                                maxLength={400}
                                onChange={handleInputChange}
                            />
                            <label>Username (optional)</label>
                            <input
                                type="text"
                                name="username"
                                className="input-field"
                                placeholder="Choose a Username"
                                value={formData.username}
                                maxLength={16}
                                onChange={handleInputChange}
                            />
                        </>
                    )}

                    <label>Email <span>*</span></label>
                    <input
                        type="email"
                        name="email"
                        className="input-field"
                        placeholder="Your Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        maxLength={30}
                        required
                    />

                    <label>Password <span>*</span></label>
                    <div className="password-container">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="input-field"
                            placeholder="Password"
                            value={formData.password}
                            maxLength={30}
                            onChange={handleInputChange}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            <Image
                                src={`/img/${showPassword ? "hide" : "show"}-light.png`}
                                alt="Toggle Password"
                                width={20}
                                height={20}
                            />
                        </button>
                    </div>

                    {!isLogin && (
                        <>
                            <label>Account Type</label>
                            <div className="account-type-container">
                                {["private", "public"].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        className={`account-btn ${formData.accountType === t ? "selected" : ""}`}
                                        onClick={() => handleAccountType(t as "private" | "public")}
                                    >
                                        {t[0].toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <div className="file-upload-container">
                                <label htmlFor="signupImage" className="file-upload">
                                    <span className="upload-icon">
                                        <Image src="/img/upload.svg" alt="Upload Icon" width={24} height={24} />
                                    </span>
                                    <span className="upload-text">{fileName}</span>
                                </label>
                                <input
                                    type="file"
                                    id="signupImage"
                                    className="hidden-file-input"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={submitDisabled} className="submit-button">
                        {isLogin ? "Log In" : "Sign Up"}
                    </button>

                    {errorMsg && <p className="error-message">{errorMsg}</p>}
                </form>

                <p className="switch-text">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <a
                        onClick={() => {
                            setErrorMsg("");
                            router.replace(isLogin ? "/signup" : "/login");
                        }}
                        className="link"
                    >
                        {isLogin ? " Sign Up" : " Log In"}
                    </a>
                </p>
            </div>
        </div>
    );
}
