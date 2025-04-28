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
            <LeftMenu type="group" />
            {children}
        </div >
    );
}
