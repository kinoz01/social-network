export const popup = (mssg: string, close: boolean) => {
    const popup = document.createElement("div");
    popup.classList.add("popup", close ? `succ` : `fail`);
    popup.innerHTML = `
        <span class="close-popup">&times;</span>
        <strong>${mssg}</strong>
    `
    document.body.appendChild(popup);
    document.querySelector(".close-popup")?.addEventListener("click", () => popup.remove())
    setTimeout(() => popup.classList.add("fade-out"), 5000)
    setTimeout(() => popup.remove(), 6500)
}

/* throttle */
export const throttle = (fn: (...a: any[]) => void, wait = 300) => {
    let waiting = false, saved: any[] | null = null;
    const timer = () => {
        if (!saved) { waiting = false; return; }
        fn(...saved); saved = null; setTimeout(timer, wait);
    };
    return (...args: any[]) => {
        if (waiting) { saved = args; return; }
        fn(...args); waiting = true; setTimeout(timer, wait);
    };
};
