import { API_URL } from "@/lib/api_url";

const fetchUsers = async () => {
    try {
        const res = await fetch(`${API_URL}/api/allUsers`,
            {
                method: "POST",
                headers: { 'Content-Type': 'application/json' }
            })
        if (!res.ok) {
            throw new Error((await res.json()).msg || "fetch failed")
        }
        const listUsers = await res.json()
        // console.log("fetch users=>", listUsers.Users)

        return listUsers
    } catch (error) {
        console.error("error fetching users", error)
        throw error
    }
}

export { fetchUsers }