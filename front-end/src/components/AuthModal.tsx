"use client";

import { useState } from "react";
import "../styles/auth.css";
import Image from "next/image";

export default function AuthModal() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="modal">
            <div className="modal-dialog">
                <h2 className="modal-title">{isLogin ? "Log In" : "Sign Up"}</h2>

                <form className="auth-form">
                    {!isLogin && (
                        <>
                            <label>First Name <span>*</span></label>
                            <input type="text" className="input-field" placeholder="First Name" required />

                            <label>Last Name <span>*</span></label>
                            <input type="text" className="input-field" placeholder="Last Name" required />

                            {/* Modern Date Input for Birthday */}
                            <label>Birthday <span>*</span></label>
                            <input type="date" className="input-field" required />

                            {/* About Me Input */}
                            <label>About Me</label>
                            <textarea className="input-field about-me" placeholder="A short bio"></textarea>
                        </>
                    )}

                    {isLogin && (
                        <>
                            <label>Email or username<span>*</span></label>
                            <input type="text" className="input-field" placeholder="Your Email or username" required />
                        </>
                    )}

                    {!isLogin && (
                        <>
                            <label>Username (optional)</label>
                            <input type="text" className="input-field" placeholder="Choose a Username" />
                        </>
                    )}

                    {!isLogin && (
                        <>
                            <label>Email <span>*</span></label>
                            <input type="email" className="input-field" placeholder="Your Email" required />
                        </>
                    )}

                    <label>Password <span>*</span></label>
                    <div className="password-container">
                        <input type="password" className="input-field" placeholder="Password" required />
                        <button type="button" className="toggle-password">
                            <Image src="/img/show-light.png" alt="Show Password" width={20} height={20} />
                        </button>
                    </div>

                    {/* Image Upload */}
                    {!isLogin && (
                        <div className="file-upload-container">
                            <label htmlFor="signupImage" className="file-upload">
                                <span className="upload-icon">
                                    <Image src="/img/upload.svg" alt="Upload Icon" width={24} height={24} />
                                </span>
                                <span className="upload-text">Upload Avatar (optional)</span>
                            </label>
                            <input type="file" id="signupImage" className="post-input hidden-file-input" accept="image/*" />
                        </div>
                    )}

                    <button type="submit" className="submit-button">{isLogin ? "Log In" : "Sign Up"}</button>
                </form>

                <p className="switch-text">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <a onClick={() => setIsLogin(!isLogin)} className="link">
                        {isLogin ? " Sign Up" : " Log In"}
                    </a>
                </p>
            </div>
        </div>
    );
}
