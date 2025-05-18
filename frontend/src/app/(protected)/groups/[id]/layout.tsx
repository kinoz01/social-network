import GroupMenu from "@/components/groups/GroupMenu";
import MembersMenu from "@/components/groups/MembersMenu";
import InviteMenu from "@/components/groups/InviteMenu";
import RequestsMenu from "@/components/groups/RequestsMenu";
import { checkMembership } from "@/lib/auth";
import style from "@/components/groups/style/groupLayout.module.css";
import { GroupSyncProvider } from "@/context/GroupSyncContext";

export default async function GroupLayout({
    params: paramsPromise,
    children,
}: {
    params: Promise<{ id: string }>;
    children: React.ReactNode;
}) {
    const { id } = await paramsPromise;
    await checkMembership(id);

    return (
            <GroupSyncProvider>
                <div className={style.groupLayout}>
                    <div className={style.menuLayout}>
                        <GroupMenu />
                        <RequestsMenu />
                    </div>
                    <div className={style.contentLayout}>
                        {children}
                    </div>
                    <div className={style.menuLayout}>
                        <MembersMenu />
                        <InviteMenu />
                    </div>
                </div>
            </GroupSyncProvider>
    );
}
