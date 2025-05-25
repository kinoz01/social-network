const popup = (mssg: string, close: boolean) => {
    const popup = document.createElement("div");
    popup.classList.add("popup", close ? `succ` : `fail`);
    popup.innerHTML = `
        <span class="close-popup">&times;</span>
        <strong>${mssg}</strong>
    `
    document.body.appendChild(popup);
    document.querySelector(".close-popup")?.addEventListener("click", () => popup.remove())
    close && setTimeout(() => popup.classList.add("fade-out"), 5000)
    close && setTimeout(() => popup.remove(), 6500)
}

export { popup }