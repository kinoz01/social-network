"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "../style/groups.module.css";
import Link from "next/link";
import { useLogout } from "@/lib/logout";
import CreateGroupModal from "./CreateGroup";

export default function Sidebar() {
    const { handleLogout } = useLogout();
    const [open, setOpen] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    return (
        <>
            {openModal && <CreateGroupModal onClose={() => setOpenModal(false)} />}

            <button className={styles.sidebarToggle} onClick={() => setOpen(!open)}>
                <Image src="/img/menu-icon.svg" alt="Menu" width={24} height={24} />
            </button>

            <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
                {/* top links */}
                <div>
                    <div
                        className={styles.menuItem}
                        style={{ marginTop: "1.5rem" }}
                        onClick={() => setOpenModal(true)}
                    >
                        <div className={styles.iconContainer}>
                            <Image src="/img/plus-icon.svg" alt="Create" width={26} height={26} />
                        </div>
                        <span className={styles.menuText}>Create</span>
                    </div>
                </div>

                {/* bottom links */}
                <div className={styles.bottomLinks}>
                    <Link href="/home" className={styles.menuItem}>
                        <div className={styles.iconContainer}>
                            <Image src="/img/home.svg" alt="Home" width={28} height={28} />
                        </div>
                        <span className={styles.menuText}>Home</span>
                    </Link>
                    <div className={styles.menuItem} onClick={handleLogout} >
                        <div className={styles.iconContainer}>
                            <Image src="/img/logout.svg" alt="Logout" width={28} height={28} />
                        </div>
                        <span className={styles.menuText}>Logout</span>
                    </div>
                </div>
            </aside>
        </>
    );
}
