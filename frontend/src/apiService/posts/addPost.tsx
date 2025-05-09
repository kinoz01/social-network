import { popup } from "@/components/posts/utils";

const HandleCreation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    var form = e.currentTarget
    const formData = new FormData(form)

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/AddPosts`,
            {
                method: "POST",
                body: formData,
                credentials: "include",
            }
        )
        if (!res.ok) {
            throw new Error((await res.json()).msg || "creation failed")
        }
        console.log('created successfully:', formData)
        form.reset()
        document.querySelector(".popup")?.remove()
        popup("Post Published Successfully!", true)
        document.querySelector("form")?.remove()
    } catch (error: any) {
        // setErrorMsg()
        console.error('creation error:', error)
        document.querySelector(".popup")?.remove()
        popup(error, false)
    }
}

export { HandleCreation }