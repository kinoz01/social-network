import styles from "../posts.module.css";
import { CreateIcon } from "@/components/icons";
import Image from "next/image";
import { useState } from "react";

type MainParams = {
  onClose: () => void;
  privacy: string;
  showCHoice: () => void;
  userName: string;
};

const MainDiv = (props: MainParams) => {
  const [fileName, setFileName] = useState("Upload Image (optionl)");

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
      <div className={styles.postOptions}>
        <div className={styles.privacy} onClick={props.showCHoice}>
          Post privacy
        </div>
        <div className={styles.postUtils}>
          <label htmlFor="postImage" className={styles.fileUpload}>
            <span className={styles.uploadText}>{fileName}</span>
            <Image
              src="/img/upload.svg"
              alt="Upload Icon"
              width={28}
              height={28}
            />
          </label>
          <input
            id="postImage"
            type="file"
            name="file"
            className={styles.uploadImgBtn}
            onChange={(e) => {
              if (e.target.files?.length) {
                setFileName(e.target.files[0].name);
              }
            }}
          />
        </div>
        <button type="submit" className={styles.submitBtn}>
          Create
        </button>
      </div>
    </>
  );
};

export { MainDiv };
