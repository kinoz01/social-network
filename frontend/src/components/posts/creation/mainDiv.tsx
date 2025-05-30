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
    const [fileName, setFileName] = useState("Add to your post (optional)");

    return (
        <>
            <button className={styles.closeBtn} onClick={props.onClose}>
                <CreateIcon />
            </button>
            <textarea
                name="content"
                className={styles.postContentInput}
                placeholder={`What's on your mind, ${props.userName}??`}
            />
            <div className={styles.privacy} onClick={props.showCHoice}>
                {props.privacy.toUpperCase()} ▼
            </div>
            <div className={styles.postUtils}>
                <label htmlFor="postImage" className={styles.fileUpload}>
                    <span className={styles.uploadText}>{fileName}</span>
                    <span className={styles.uploadIcon}>
                        <Image src="/img/postImg.svg" alt="Upload Icon" width={28} height={28} />
                    </span>
                </label>
                <input id="postImage" type="file" name="file" className={styles.uploadImgBtn}
                    onChange={(e) => {
                        if (e.target.files?.length) {
                            setFileName(e.target.files[0].name)
                        }
                    }} />
            </div>
            <button type="submit" className={styles.submitBtn}>
                Create
            </button>
        </>
    )
}

export { MainDiv }