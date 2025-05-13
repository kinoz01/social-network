"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import Image from "next/image";
import styles from "./style/groupPostInput.module.css";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";

export default function GroupPostInput() {
    const groupId = useParams().id as string;
    const { user } = useUser();
    const [text, setText] = useState("");
    const [image, setImg] = useState<File | null>(null);
    const [loading, setLoad] = useState(false);
    const [errMsg, setErr] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    
    if (!user) return null;
    
    const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImg(e.target.files?.[0] ?? null);
    };

    const Submit = async () => {
        if (!text.trim()) return;
        setErr("");
        const fd = new FormData();
        fd.append("group_id", groupId);
        fd.append("body", text.trim());
        if (image) fd.append("image", image);

        setLoad(true);
        try {
            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/create-post`, {
                method: "POST",
                body: fd,
                credentials: "include",
            });
            if (!r.ok) throw new Error();
            setText("");
            setImg(null);
        } catch {
            setErr("Could not post");
        } finally { setLoad(false); }
    };

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        Submit();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            Submit();
        }
    };

    const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";
    };

    const avatar = user.profile_pic
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${user.profile_pic}`
        : "/img/default-avatar.png";

    return (
        <form onSubmit={onSubmit} className={styles.postBox}>
            <div className={styles.inputRow}>
                <Image src={avatar} alt="" width={40} height={40} className={styles.avatar} />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={onKeyDown}
                    onInput={onInput}
                    placeholder="Share your thoughts..."
                    className={styles.input}
                    rows={2}
                />
                <button type="submit" disabled={loading} className={styles.postButtonIcon}>
                    <Image src="/img/arrow-up.svg" alt="Send" width={20} height={20} />
                </button>
            </div>

            <div className={styles.actionRow}>
                {errMsg && <span className={styles.error}>{errMsg}</span>}
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={onPick}
                />
                <button
                    type="button"
                    className={styles.imageButton}
                    onClick={() => fileRef.current?.click()}
                >
                    <Image src="/img/image-icon.svg" alt="Add image" width={20} height={20} />
                    Image
                </button>
                {image && <span className={styles.fileName}>{image.name}</span>}
            </div>
        </form>
    );
}
