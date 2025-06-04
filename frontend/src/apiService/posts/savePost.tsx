import React from "react";
import { Post, User } from "@/lib/types";
import { popup } from "@/components/utils";
import { API_URL } from "@/lib/api_url";


type handleSbmtParams = {
    e: React.FormEvent<HTMLFormElement>;
    onClose: () => void;
    onSubmit: (post: Post) => void;
    userData: User

}

const HandleCreation = async (props: handleSbmtParams) => {
    props.e.preventDefault();
    var form = props.e.currentTarget
    const formData = new FormData(form)

    const content = formData.get('content')
    const file = formData.get('file') as File | null;
    if (!content && !file?.name) {
        popup("post content cannot be empty", false)
        return
    }

    try {
        const res = await fetch(`${API_URL}/api/createPost`,
            {
                method: "POST",
                body: formData,
                credentials: "include",
            }
        )
        if (!res.ok) {
            throw new Error((await res.json()).msg || "creation failed")
        }

        const post: Post = await res.json()
        const newPost: Post = {
            ...post,
            userID: props.userData?.id,
            firstName: props.userData?.first_name,
            lastName: props.userData?.last_name,
            profile_pic: props.userData?.profile_pic,
            // createdAt: post.,//---
        }
        props.onSubmit(newPost)
        form.reset()
        document.querySelector(".popup")?.remove()
        popup("post published successfully", true)
        document.querySelector("form")?.remove()
        props.onClose()
    } catch (error: any) {
        console.error('creation error:', error)
        document.querySelector(".popup")?.remove()
        popup(error, false)
    }

}

export { HandleCreation }