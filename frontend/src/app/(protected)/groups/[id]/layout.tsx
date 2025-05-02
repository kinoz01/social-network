import Feed from "@/components/posts/Feed";
import RightMenu from "@/components/menus/RightMenu";
import LeftMenu from "@/components/menus/LeftMenu";

export default async function GroupLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="mainContent group">
            <LeftMenu type="groups" />
            {children}
        </div >
    );
}


// export default function RootLayout({
//     children,
// }: Readonly<{
//     children: React.ReactNode;
// }>) {
//     return (
//         <html lang="en">
//             <body className={`${geistSans.variable} ${geistMono.variable}`}>
//                 <main className={styles.main}>
//                     <SideBar />
//                     {/* <div className="mainContent"> */}
//                     {children}
//                     {/* </div> */}
//                 </main>
//             </body>
//         </html>
//     );
// }