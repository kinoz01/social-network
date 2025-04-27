import { requireSession } from "@/lib/auth";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireSession(); // Protect everything under (protected)

    return (
        <div>
            {children}
        </div>
    );
}