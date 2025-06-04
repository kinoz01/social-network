import Image from "next/image";

function NoData({ msg }: { msg: string }) {
  return (
    <div className="no-data">
      <Image
        src="/img/empty.svg"
        alt="empty"
        className="img"
        width={150}
        height={150}
      />
      <span className="no-data-msg">{msg}</span>
    </div>
  );
}

export default NoData;
