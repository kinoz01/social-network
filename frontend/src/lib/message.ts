"use client"

import {  User } from "./user";

export interface Messages {
    id: string,
    sender_id: string,
    receiver_id: string,
    content: string,
    is_read: number,
    created_at: string,
    first_name: string,
    last_name: string
}

export async function fetchMessages(user: User, currentUser:User)  {
  try {
    // const currentUser = await getUser()
    console.log(currentUser?.id, user.id);
    if (!currentUser?.id || !user.id) {
        console.error("User data is not valid", currentUser);
        return [];  // Return empty array if currentUser is not valid
    }
    const messageRequest = await fetch("http://localhost:8080/api/fetchMessages", {
        method: "POST", 
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({sender_id : currentUser?.id, receiver_id : user.id})
      })
      console.log(messageRequest);
      if(!messageRequest.ok){
        throw new Error(`HTTP error! status: ${messageRequest.status}`);
      }
      const messages = await messageRequest.json()
      return messages
  }catch(error) {
    console.log("error fetvhing messages: ", error);
    return []
    
  }
}