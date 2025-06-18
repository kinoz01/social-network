// app/not-found.tsx
import Image from "next/image";
import Link from "next/link";
import styles from "./not-found.module.css";

export const metadata = {
    title: "Page Not Found",
};

export default function NotFound() {
    return (
        <main className={styles.wrapper}>
            <Image
                src="/img/404.svg"
                alt="404 image"
                width={320}
                height={320}
                priority
                className={styles.img}
            />

            <h1 className={styles.title}>404</h1>
            <p className={styles.tagline}>We couldn't find the page.</p>

            <Link href="/" className={styles.home}>
                Take me home
            </Link>
        </main>
    );
}
