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
            const data = JSON.parse(event.data)
            console.log("message from server ", data);
            
        })

        socketRef.current.addEventListener('error', (error) => {
            console.error('websocket error', error);
            
        })
        socketRef.current.addEventListener('close', () => {
            console.log("connection closed");
            
        })

        //clean up function
        return () => {
            if(socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close(1000, "connection closed")
            }
        }
    }, [])


    useEffect(() => {
        
        const fetchUsersData = async () => {
            const usersData = await fetchUsers(); 
            setUsers(usersData); 
          };
          let time = setTimeout(() => {
            fetchUsersData()
          }, 500)
          return () => clearTimeout(time)
    }, [])

    useEffect(() => {
        const userElemts = document.querySelectorAll('.userBox')
        userElemts.forEach((userElement, index) => {
            userElement.addEventListener('click', () => {
              console.log('User clicked:', userElement.textContent); // You can also use other user data here
              const containerMessage = document.querySelector('.messageContainer')
              if (containerMessage) containerMessage.remove()
             
                const container = document.createElement('div')
                container.className = 'messageContainer'
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
                    SendMessage(messageInput)
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


    const SendMessage = (messageInput) => {
        const message = messageInput.value.trim()
        console.log(message, "message");
        
        const time = new Date().toDateString()
        console.log(time)
        if (message == "") return
        const data = {
            type: "message",
            senderId: 2,
            receiverId: 2,
            text: message,
            timestamp: time
        }
        socketRef.current.send(JSON.stringify(data))
    }

    return <>
            <h1>chat page</h1>
            <div className="chatContainer">
                <div className="chatBox">
                    {users.map((user, index) => (
                        <div className="userBox" data-user-id={user.user_id} key={index}>
                            <div className="img-username">
                                <span className="connected"></span>
                                <div className="user-message">
                                    <h2 className="username">{user.username}</h2>
                                    <p className="message"></p>
                                </div>
                            </div>
                            <div className="time-msgNumber">
                                <div className="time"></div>
                                <span className="msgNmb"></span>
                            </div>
                        </div>
                    ))} 
                </div>
                
            </div>  
        
        {/* <ul>
            {users.map((user, index)=> (
               <li key={index} id={user.user_id} className="users">
               {user.username}
             </li>
            ))}
        </ul> */}

    </>
}

async function fetchUsers() {
    const resp = await fetch("http://localhost:8080/api/fetchUsers")
    console.log(resp);
    if(!resp.ok) throw new Error("Failedd to fetch users!")
    const users = await resp.json()
    console.log( users);
    return users
    
}
