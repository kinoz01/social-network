import { Post, CommentInfo } from "@/lib/types";
import { API_URL } from "@/lib/api_url";


export const fetchOldPosts = async (pageNum: number, type?: string, id?: string) => {
    const url =
        type === "profile" ? `${API_URL}/api/allPosts?pageNum=${pageNum}&profileId=${id}`
            : type === "group" ? `${API_URL}/api/allPosts?pageNum=${pageNum}&groupId=${id}`
                : `${API_URL}/api/allPosts?pageNum=${pageNum}`;

    try {
        const res = await fetch(url,
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })
        if (res.status === 206) {
            throw Object.assign(new Error("private profile"), { status: 206 });
        } else if (res.status === 404) {
            throw Object.assign(new Error("profile not found"), { status: 404 });
        } else if (!res.ok) {
            throw Object.assign(new Error("something went wrong"), { status: res.status });
        }
        const posts: Post[] = await res.json()
        return posts
    } catch (error) {
        throw error
    }
}

export const COmmentsGetter = async ({ postID, page }: { postID: string, page: number }) => {
    const queryParams = new URLSearchParams({
        postId: postID,
        page: page.toString()
    })
    try {
        const res = await fetch(`${API_URL}/api/comments?${queryParams.toString()}`,
            {
                method: 'GET',
                credentials: 'include',
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