import type { Metadata } from "next";
import { Roboto } from "next/font/google";
// import "../styles/globals.css";
// import "../styles/theme.css";

export const metadata: Metadata = {
  title: "Social Network",
  description: "Social platform",
};

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.className}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
