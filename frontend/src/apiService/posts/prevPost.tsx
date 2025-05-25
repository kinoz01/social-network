import { Post } from "@/components/posts/Feed"
import { CommentInfo } from "@/components/comments/Comment";

var i = 0
export const fetchOldPosts = async (pageNum: number) => {
    console.log("in fetch oldposts", i++);

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/allPosts/${pageNum}`,
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            })
        if (!res.ok) {
            throw new Error((await res.json()).msg || "failed to fetch posts")
            //   console.log("fetch users=>", listUsers.Users)
        }
        const posts: Post[] = await res.json()
        return posts
    } catch (error) {
        console.error("failed to fetch posts", error)
        throw error
    }
}

export const COmmentsGetter = async ({ postID }: { postID: string }) => {
    const queryParams = new URLSearchParams({
        postId: postID
    })
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/comments?${queryParams}`,
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