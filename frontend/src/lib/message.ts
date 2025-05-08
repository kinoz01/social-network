"use client"

import { getUser, User } from "./user";

export interface Messages {
    id: string,
    sender_id: string,
    receiver_id: string,
    content: string,
    is_read: number,
    created_at: string
}

export async function fetchMessages(user: User)  {
    const userData = await getUser()
    console.log(userData);
    if (!userData || !userData.id) {
        console.error("User data is not valid", userData);
        return [];  // Return empty array if userData is not valid
    }
    const messageRequest = await fetch("http://localhost:8080/api/fetchMessages", {
        method: "POST", 
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({sender_id : userData?.id, receiver_id : user.id})
      })
      
      console.log(messageRequest);
      const messages = await messageRequest.json()
      // return messages
    //   console.log(messages);
      return messages
}