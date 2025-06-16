import styles from "../posts.module.css"
import { CreateIcon } from "@/components/icons";
import Image from "next/image";
import { useState } from "react";

type MainParams = {
    onClose: () => void;
    privacy: string;
    showCHoice: () => void;
    userName: string;
}

const MainDiv = (props: MainParams) => {
    const [fileName, setFileName] = useState("upload image (optional)");

    return (
        <>
            <button
                className={styles.closeBtn}
                onClick={props.onClose}
                aria-label="Close"
            >
                ×
            </button>
            <textarea
                name="content"
                className={styles.postContentInput}
                placeholder={`What's on your mind, ${props.userName}??`}
                maxLength={3000}
            />
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.privacySelect}
                    onClick={props.showCHoice}
                >
                    {props.privacy.replace(/^\w/, c => c.toUpperCase())}
                    <span className={styles.arrow} />
                </button>
                <div className={styles.postUtils}>
                    <label htmlFor="postImage" className={styles.fileUpload}>
                        <span className={styles.uploadText}>{fileName}</span>
                        <span className={styles.uploadIcon}>
                            <Image src="/img/upload.svg" alt="Upload Icon" width={28} height={28} />
                        </span>
                    </label>
                    <input id="postImage" type="file" name="file" className={styles.uploadImgBtn}
                        onChange={(e) => {
                            if (e.target.files?.length) {
                                setFileName(e.target.files[0].name)
                            }
                        }} />
                </div>
            </div>
        </>
    )
}

export { MainDiv }