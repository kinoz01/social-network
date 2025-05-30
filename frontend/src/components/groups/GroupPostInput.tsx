"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import Image from "next/image";
import styles from "./style/groupPostInput.module.css";
import { useUser } from "@/context/UserContext";
import { useParams } from "next/navigation";
import { useGroupFeed } from "@/context/GroupFeedContext";


export default function GroupPostInput() {
    const groupId = useParams().id as string;
    const { user } = useUser();
    const [text, setText] = useState("");
    const [image, setImg] = useState<File | null>(null);
    const [loading, setLoad] = useState(false);
    const [errMsg, setErr] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const { refreshFeed } = useGroupFeed();

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
            if (!r.ok) throw new Error((await r.json()).msg || "Could not post");
            setText("");
            setImg(null);
            refreshFeed();

              // Reset textarea height
            const ta = document.querySelector(`.${styles.input}`) as HTMLTextAreaElement;
            if (ta) {
                ta.style.height = "auto"; // reset height
            }
        } catch (err: any) {
            setErr(err.message || "Could not post");
        } finally {
            setLoad(false);
        }
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
                    maxLength={1500}
                />
                <button type="submit" disabled={loading} className={styles.postButtonIcon}>
                    <Image src="/img/arrow-up.svg" alt="Send" width={18} height={18} />
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
                {image && <span className={styles.fileName}>{truncateFileName(image.name, 50)}</span>}
                <button
                    type="button"
                    className={styles.imageButton}
                    onClick={() => fileRef.current?.click()}
                >
                    <Image src="/img/upload.svg" alt="Add image" width={25} height={25} />
                </button>
            </div>
        </form>
    );
}

function truncateFileName(name: string, max: number = 30): string {
    if (name.length <= max) return name;
    const dotIndex = name.lastIndexOf(".");
    if (dotIndex <= 0) return name.slice(0, max - 3) + "...";
    const ext = name.slice(dotIndex);
    const base = name.slice(0, max - ext.length - 3);
    return base + "..." + ext;
}