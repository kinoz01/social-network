"use client";
import { useState } from "react";
import "../styles/auth.css";
import Image from "next/image";

interface FormData {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    birthday: string;
    aboutMe: string;
    profilePic: File | null;
}

export default function AuthModal() {
    const [isLogin, setIsLogin] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    const [formData, setFormData] = useState<FormData>({
        email: "",
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        birthday: "",
        aboutMe: "",
        profilePic: null,
    });

    const displayError = (text: string) => setErrorMsg(text);

    const validateSignup = (data: FormData) => {
        if (!data.firstName.trim()) return "First Name is required.";
        if (!data.lastName.trim()) return "Last Name is required.";
        if (!data.birthday.trim()) return "Birthday is required.";
        if (!data.email.trim()) return "Email is required.";
        if (!data.password.trim()) return "Password is required.";
        return "";
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFormData(prev => ({ ...prev, profilePic: e.target.files![0] }));
        }
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");
        const err = validateSignup(formData);
        if (err) return displayError(err);

        const signupData = new FormData();
        signupData.append("email", formData.email);
        if (formData.username) signupData.append("username", formData.username);
        signupData.append("password", formData.password);
        signupData.append("first_name", formData.firstName);
        signupData.append("last_name", formData.lastName);
        signupData.append("birthday", formData.birthday);
        signupData.append("about_me", formData.aboutMe);
        if (formData.profilePic) signupData.append("profile_pic", formData.profilePic);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signup`, { method: "POST", body: signupData });
            if (!res.ok) displayError((await res.json()).msg);
            else {
                localStorage.setItem("newUser", "true");
                setIsLogin(true);
            }
        } catch {
            displayError("Network error or invalid image format.");
        }
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMsg("");
        if (!formData.email.trim() && !formData.username.trim()) {
            return displayError("Please enter your email or username.");
        }
        if (!formData.password.trim()) return displayError("Please enter your password.");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    emailOrUsername: formData.email || formData.username, password: formData.password
                }),
            });
            if (!res.ok) displayError((await res.json()).msg);
            else localStorage.setItem("justLoggedIn", "true");
        } catch {
            displayError("Network error or invalid credentials.");
        }
    };

    return (
        <div className="modal">
            <div className="modal-dialog">
                <h2 className="modal-title">{isLogin ? "Log In" : "Sign Up"}</h2>
                <form className="auth-form" onSubmit={isLogin ? handleLogin : handleSignUp}>
                    {!isLogin && (
                        <>
                            <label>First Name <span>*</span></label>
                            <input type="text" name="firstName" className="input-field" placeholder="First Name" value={formData.firstName} onChange={handleInputChange} required />
                            <label>Last Name <span>*</span></label>
                            <input type="text" name="lastName" className="input-field" placeholder="Last Name" value={formData.lastName} onChange={handleInputChange} required />
                            <label>Birthday <span>*</span></label>
                            <input type="date" name="birthday" className="input-field" value={formData.birthday} onChange={handleInputChange} required />
                            <label>About Me</label>
                            <textarea name="aboutMe" className="input-field about-me" placeholder="A short bio" value={formData.aboutMe} onChange={handleInputChange} />
                        </>
                    )}

                    {isLogin ? (
                        <>
                            <label>Email or Username <span>*</span></label>
                            <input type="text" name="email" className="input-field" placeholder="Your Email or Username" value={formData.email} onChange={handleInputChange} required />
                        </>
                    ) : (
                        <>
                            <label>Username (optional)</label>
                            <input type="text" name="username" className="input-field" placeholder="Choose a Username" value={formData.username} onChange={handleInputChange} />
                            <label>Email <span>*</span></label>
                            <input type="email" name="email" className="input-field" placeholder="Your Email" value={formData.email} onChange={handleInputChange} required />
                        </>
                    )}

                    <label>Password <span>*</span></label>
                    <div className="password-container">
                        <input type="password" name="password" className="input-field" placeholder="Password" value={formData.password} onChange={handleInputChange} required />
                        <button type="button" className="toggle-password" onClick={() => { }}>
                            <Image src="/img/show-light.png" alt="Show Password" width={20} height={20} />
                        </button>
                    </div>

                    {!isLogin && (
                        <div className="file-upload-container">
                            <label htmlFor="signupImage" className="file-upload">
                                <span className="upload-icon">
                                    <Image src="/img/upload.svg" alt="Upload Icon" width={24} height={24} />
                                </span>
                                <span className="upload-text">Upload Avatar (optional)</span>
                            </label>
                            <input type="file" id="signupImage" className="post-input hidden-file-input" accept="image/*" onChange={handleFileChange} />
                        </div>
                    )}

                    {errorMsg && <p className="error-message">{errorMsg}</p>}
                    <button type="submit" className="submit-button">{isLogin ? "Log In" : "Sign Up"}</button>
                </form>

                <p className="switch-text">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <a onClick={() => { setErrorMsg(""); setIsLogin(!isLogin); }} className="link">
                        {isLogin ? " Sign Up" : " Log In"}
                    </a>
                </p>
            </div>
        </div>
    );
}
