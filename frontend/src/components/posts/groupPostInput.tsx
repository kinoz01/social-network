import {
    useState,
    useRef,
    FormEvent,
    KeyboardEvent,
} from "react";
import Image from "next/image";
import { useUser } from "@/context/UserContext";
import styles from "@/components/groups/style/groupPostInput.module.css";
import { Post } from "@/lib/types";
import { API_URL } from "@/lib/api_url";


/* ─────────────────────  POST INPUT ───────────────────── */
export default function PostInput({
    groupId,
    onAdd,
}: {
    groupId: any;
    onAdd: (p: Post) => void;
}) {
    const { user } = useUser();
    const [text, setText] = useState("");
    const [image, setImg] = useState<File | null>(null);
    const [loading, setLoad] = useState(false);
    const [errMsg, setErr] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    /* ---------- handlers ---------- */
    const onPick = (e: React.ChangeEvent<HTMLInputElement>) =>
        setImg(e.target.files?.[0] ?? null);

    const submit = async () => {
        if (!text.trim()) return;

        const fd = new FormData();
        fd.append("group_id", groupId);
        fd.append("content", text.trim());
        if (image) fd.append("imag_post", image);

        setLoad(true);
        try {
            const r = await fetch(
                `${API_URL}/api/groups/create-post?group_id=${groupId}`,
                { method: "POST", body: fd, credentials: "include" }
            );
            if (!r.ok) throw new Error((await r.json()).msg || "Could not post");

            const added: Post = await r.json();
            onAdd(added);          // prepend to feed
            setText("");
            setImg(null);
            setErr("");

            // reset height
            const ta = document.querySelector(`.${styles.input}`) as HTMLTextAreaElement | null;
            if (ta) ta.style.height = "auto";
        } catch (e: any) {
            setErr(e.message || "Could not post");
        } finally {
            setLoad(false);
        }
    };

    const onSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        submit();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
        const ta = e.currentTarget;
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";
    };

    const avatar = user.profile_pic
        ? `${API_URL}/api/storage/avatars/${user.profile_pic}`
        : "/img/default-avatar.png";

    /* ---------- UI ---------- */
    return (
        <form onSubmit={onSubmit} className={styles.postBox}>
            <div className={styles.inputRow}>
                <div className={styles.textareaWrapper}>
                    <Image src={avatar} alt="" width={40} height={40} className={styles.avatar} unoptimized />
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={onKeyDown}
                        onInput={onInput}
                        placeholder={`What's on your mind, ${user?.first_name?.toUpperCase() ?? ''}?`}
                        className={styles.input}
                        rows={2}
                        maxLength={1500}
                    />
                </div>
                <button type="submit" disabled={loading} className={styles.postButtonIcon}>
                    <Image src="/img/arrow-up.svg" alt="" width={18} height={18} />
                </button>
            </div>

            <div className={styles.actionRow}>
                {errMsg && <span className={styles.error}>{errMsg}</span>}

                <input
                    ref={fileRef}
                    type="file"
                    hidden
                    onChange={onPick}
                />
                {image && (
                    <span className={styles.fileName}>
                        {truncateFileName(image.name, 50)}
                    </span>
                )}
                <button
                    type="button"
                    className={styles.imageButton}
                    onClick={() => fileRef.current?.click()}
                >
                    <Image src="/img/upload.svg" alt="" width={25} height={25} />
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