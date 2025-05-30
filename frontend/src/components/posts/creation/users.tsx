import { fetchUsers } from "@/apiService/users/apiUsers";
import styles from "../posts.module.css"
import { BackIcon } from "@/components/icons";
import React, { useState, useEffect } from "react";
import { User } from "@/components/types";
import Image from "next/image";

type UsersListParams = {
    onBack: () => void;
    onUserCHange: (users: string[]) => void;
    userID: string
}
interface FollowerInfo {
    id: string;
    username: string;
}

const ShowUsers = (props: UsersListParams) => {
    const [selectedUser, setSelected] = useState<FollowerInfo[]>([])
    const [List_Users, setLIstUsers] = useState<User[]>([])


    const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valueID = e.target.value
        const isChecked = e.target.checked
        const valueName = e.target.dataset.username || "undefined"
        const listUsers = isChecked ? ([...selectedUser, { id: valueID, username: valueName }]) :
            (selectedUser.filter((elem) => elem.id != valueID))
        setSelected(listUsers)
        props.onUserCHange(listUsers.map((u) => u.id))
    }

    useEffect(() => {
        fetchUsers()
            .then(data => setLIstUsers(data.Users))
    }, [])

    // console.log("liste of users", selectedUser);

    // console.log("here, -------", List_Users && List_Users[0].id)
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
                        <p className={styles.chipLabel}>{elem.username}</p>
                    </div>
                ))}
            </div>
            <div className={styles.content}>
                {List_Users && List_Users.map((elem) => (
                    <div key={elem.id} className={styles.checkboxElem}>
                        <input type="checkbox" name="vipUsers" id={elem.id} value={elem.id} data-username={elem.username || elem.email} onChange={handleSelect}
                            checked={selectedUser.some((u) => u.id === elem.id)} />
                        <Image
                            className={styles.userIcon}
                            // src={`/storage/avatars/${elem.profile_pic}`}
                            src={`${process.env.NEXT_PUBLIC_API_URL}/api/storage/avatars/${elem.profile_pic}`}
                            alt={elem.first_name}
                            width={30}
                            height={30}
                        />

                        <label htmlFor={elem.id}>{elem.username}</label>
                        <span>{elem.email}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export { ShowUsers }