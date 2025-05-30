import Link from "next/link";
import Loading from "./Loading";

function NavButton({
  state,
  title,
  link,
  icon,
  count,
  loading,
}: {
  state: Boolean;
  title: String;
  link: String;
  icon: React.ReactNode;
  count?: number;
  loading?: boolean;
}) {
  return (
    <Link href={`/${link}`} className="navSection">
      {icon}
      {state ? <span>{title}</span> : null}
      { count && count !== 0 ? (
        <div className="notificationCount">{String(count)}</div>
      ) : null}
    </Link>
  );
}

export default NavButton;
