const fetchUsers = async () => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/allUsers`,
            {
                method: "POST",
                headers: { 'Content-Type': 'application/json' }
            })
        if (!res.ok) {
            throw new Error((await res.json()).msg || "fetch failed")
        }
        const listUsers = await res.json()
        console.log("fetch users=>", listUsers.Users)

        return listUsers
    } catch (error) {
        console.error("error fetching users", error)
        throw error
    }
}

export { fetchUsers }