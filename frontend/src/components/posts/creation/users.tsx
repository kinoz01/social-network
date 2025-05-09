import styles from "../posts.module.css"
import { BackIcon } from "@/components/icons";
import React, { useState } from "react";

const List_Users = [{ id: "1", value: "eman" }, { id: "2", value: "ihssan" }, { id: "3", value: "hasnae" }]

type UsersListParams = {
    onBack: () => void;
    onUserCHange: (users: string[]) => void;
}

const ShowUsers = (props: UsersListParams) => {
    const [selectedUser, setSelected] = useState<string[]>([])

    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const isChecked = e.target.checked
        const listUsers = isChecked ? ([...selectedUser, value]) :
            (selectedUser.filter((elem) => elem != value))
        setSelected(listUsers)
        props.onUserCHange(listUsers)
    }

    return (
        <div className={styles.postAud}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={(e) => {
                    e.preventDefault()
                    props.onBack()
                }}>
                    <BackIcon />
                </button>
                <span className={styles.title}>User List</span>
            </div>
            <div className={styles.listUsers}>
                <label>Who can view your post:</label>
                {selectedUser.map((elem, i) => (
                    <div key={i} className={styles.chip}>
                        <p className={styles.chipLabel}>{elem}</p>
                    </div>
                ))}
            </div>
            <div className={styles.content}>
                {List_Users.map((elem) => (
                    <div key={elem.id} className={styles.checkboxElem}>
                        <input type="checkbox" name="vipUsers" id={elem.id} value={elem.value} onChange={handleSelect}
                            checked={selectedUser.includes(elem.value)} />
                        <label htmlFor={elem.id}>{elem.value}</label>
                    </div>
                ))}
            </div>
        </div>
    )
}

export { ShowUsers }