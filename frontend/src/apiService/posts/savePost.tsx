import React from "react";
import { Post } from "@/components/posts/Feed";
import { User } from "@/lib/user";
import { popup } from "@/components/posts/utils";

type handleSbmtParams = {
    e: React.FormEvent<HTMLFormElement>;
    onClose: () => void;
    onSubmit: (post: Omit<Post, "id">) => void;
    userData: User

}

const HandleCreation = async (props: handleSbmtParams) => {
    props.e.preventDefault();
    var form = props.e.currentTarget
    const formData = new FormData(form)
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/createPost`,
            {
                method: "POST",
                body: formData,
                credentials: "include",
            }
        )
        if (!res.ok) {
            throw new Error((await res.json()).msg || "creation failed")
        }
        console.log("dtat", formData.get("imag_post"), "content", formData.get("content"))
        const post: Post = await res.json()
        const newPost: Post = {
            ...post,
            userID: props.userData?.id,
            firstName: props.userData?.first_name,
            lastName: props.userData?.last_name,
            profile_pic: props.userData?.profile_pic,
            createdAt: new Date().toISOString(),
        }

        console.log('post created successfully', formData)
        props.onSubmit(newPost)
        form.reset()
        document.querySelector(".popup")?.remove()
        popup("post published successfully", true)
        document.querySelector("form")?.remove()
        props.onClose()
    } catch (error: any) {
        // setErrorMsg()
        console.error('creation error:', error)
        document.querySelector(".popup")?.remove()
        popup(error, false)
    }

}

export { HandleCreation }