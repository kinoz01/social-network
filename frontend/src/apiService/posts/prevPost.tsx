import { Post } from "@/components/posts/Feed"

export const fetchOldPosts = async (pageNum: number) => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/allPosts/${pageNum}`,
            {
                method: "GET",
                headers: { 'Content-Type': 'application/json' }
            })
        if (!res.ok) {
            throw new Error((await res.json()).msg || "failed to fetch posts")
            //   console.log("fetch users=>", listUsers.Users)
        }
        const posts: Post[] = await res.json()
        console.log("fetch posts=>", posts)
        return posts
    } catch (error) {
        console.error("failed to fetch posts", error)
        throw error
    }
}