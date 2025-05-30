import { API_URL } from "@/lib/api_url";
import { CommentInfo, Post } from "./types";


export const fetchOldPosts = async (pageNum: number) => {
    try {
        const res = await fetch(`${API_URL}/api/allPosts/${pageNum}`,
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })
        if (!res.ok) {
            throw new Error((await res.json()).msg || "failed to fetch posts")
        }
        const posts: Post[] = await res.json()
        return posts
    } catch (error) {
        console.error("failed to fetch posts", error)
        throw error
    }
}

export const CommentsGetter = async ({ postID, page }: { postID: string, page: number }) => {
    const queryParams = new URLSearchParams({
        postId: postID,
        page: page.toString()
    })
    try {
        const res = await fetch(`${API_URL}/api/comments?${queryParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        if (!res.ok) {
            throw new Error('failed to fetch comments')
        }
        const comments: CommentInfo[] = await res.json()
        return comments
    } catch (err: any) {
        console.error("error in", err)
    }
}