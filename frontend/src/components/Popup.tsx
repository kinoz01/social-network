import { useEffect } from "react";

function Popup({ msg, close }: { msg: string; close: boolean }) {
  const duration = 3000;

  useEffect(() => {
    if (!close) {
      const timer = setTimeout(() => {
        close = true;
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [close, duration]);

  if (close) return;

  return (
    <div className={`popup ${close ? "succ" : "fail"}`}>
      <div className="popup-msg">{msg}</div>
    </div>
  );
}

export default Popup;
