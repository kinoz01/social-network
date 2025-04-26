'use client'
import { useEffect, useRef, useState } from "react"
export default function ChatPage() {
    console.log("true")
    const [users, setUsers] = useState([]);
    const socketRef = useRef(null)
    useEffect(() => {
        socketRef.current = new WebSocket("ws://localhost:8080/ws")
        socketRef.current.addEventListener('open', (event) => {
            console.log(event);
            
            console.log("websocket connection is opened");
            
        })
        socketRef.current.addEventListener('message', (event) => {
            const data = JSON.parse(event)
            console.log("message from server ", data);
            
        })
    })


    useEffect(() => {
        
        const fetchUsersData = async () => {
            const usersData = await fetchUsers(); 
            setUsers(usersData); 
          };
          fetchUsersData()
    }, [])

    useEffect(() => {
        const userElemts = document.querySelectorAll('.users')
        userElemts.forEach((userElement, index) => {
            userElement.addEventListener('click', () => {
              console.log('User clicked:', userElement.textContent); // You can also use other user data here
              const containerMessage = document.querySelector('.containerMessage')
              if (containerMessage) containerMessage.remove()
             
                const container = document.createElement('div')
                container.className = 'containerMessage'
                container.id = users[index].user_id
                container.textContent = "yes"
                container.innerHTML = `
                                        <div class="username-arrowLeft goBack">
                                            <i class="fa-solid fa-arrow-left"></i>
                                            <div class="username">${users[index].username}</div>
                                        </div>
                                        <div class="messageBox">
                                        </div>
                                        <div class="inputContainer">
                                            <input type="text" placeholder="Type your message...">
                                            <input type="button" value="send">
                                        </div>
                `
                document.body.appendChild(container)

                const sendButton = container.querySelector('input[type="button"]');
                const messageInput = container.querySelector('input[type="text"]');

                sendButton.addEventListener('click', () => {
                    SendMessage()
                })
                
            });
          });

          return () => {
            userElemts.forEach((userElement) => {
              userElement.removeEventListener('click', () => {
                console.log('User clicked:', userElement.textContent);
              });
            });
          };
    },[users])



    
    return <>
        <h1>chat page</h1>
        <ul>
            {users.map((user, index)=> (
               <li key={index} id={user.user_id} className="users">
               {user.username}
             </li>
            ))}
        </ul>

    </>
}

async function fetchUsers() {
    const resp = await fetch("http://localhost:8080/api/fetchUsers")
    console.log(resp);
    
    const users = await resp.json()
    console.log( users);
    return users
    
}
