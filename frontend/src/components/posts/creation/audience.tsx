
import styles from "../posts.module.css"
import { BackIcon } from "@/components/icons"


const Privacy_inputs = [{ value: "private", subText: "Only the followers chosen in this post will be able to see it" },
{ value: "almost-private", subText: "Only followers of the creator of the post will be able to see the post" },
{ value: "public", subText: "All users in the social network will be able to see the post" }
]

type AudienceParams = {
    onBack: () => void;
    selectedPrivacy: string;
    onPrivacyChange: (value: string) => void;
}

const PostAudience = (props: AudienceParams) => {
    return (
        <div className={styles.postAud}>

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={(e) => {
                    e.preventDefault()
                    props.onBack()
                }}>
                    <BackIcon />
                </button>
                <span className={styles.title}>Post audience</span>
            </div>

            <div className={styles.content}>
                <p className={styles.description}>
                    Who can see your post?
                </p>
                <p className={styles.subDescription}>
                    Your default audience is set to <strong>Public</strong>, but you can change the audience of this specific post.
                </p>

                <div className={styles.options}>
                    {Privacy_inputs.map((elem) => (
                        <div key={elem.value} className={styles.option} onClick={() => props.onPrivacyChange(elem.value)}>
                            <input type="radio" name="privacy" id={elem.value} value={elem.value}
                                checked={props.selectedPrivacy === elem.value}
                                onChange={() => { }}
                            />
                            <label htmlFor={elem.value}>
                                <div className={styles.optionText}>
                                    <span>{elem.value}</span>
                                    <span className={styles.optionSubtext}>{elem.subText}</span>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

export { PostAudience }