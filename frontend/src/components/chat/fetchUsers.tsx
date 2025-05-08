"use client"
import { User } from "@/lib/user";
import { useEffect, useState } from "react";


export  default function FetchUsers() {
    const [users, setUsers] = useState<User[] | null>(null)

    useEffect(() => {
        const getUsers = async() => {
        try{
                const resp = await fetch(`http://localhost:8080/api/fetchUsers`, {
                    method: "POST",
                })
                console.log(resp);
                const responseUsers = await resp.json()
                if(!resp.ok) {
                    console.log("error in fetching users!!!");
                    return []
                }
                setUsers(responseUsers)
            }catch(error) {
                console.log("error: ", error);
                return []
                
            }
        }
        
        getUsers()
    }, [])
    return users
}

