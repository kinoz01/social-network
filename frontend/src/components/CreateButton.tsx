"use client";

import { useState } from "react";
import { CreateIcon } from "./icons";
import AddPost from "./posts/AddPost";
import CreateGroupModal from "../app/(protected)/groups-dashboard/components/CreateGroup";

function CreateButton() {
  const [create, setCreate] = useState(false);
  const [newPost, setNewPost] = useState(false);
  const [newGroup, setNewGroup] = useState(false);

  console.log("create: ", create);
  console.log("newPost: ", newPost);

  const close = () => {
    newPost ?
      setNewPost(false) : setNewGroup(false)
  };

  return (
    <>
      <div className="create">
        <button
          className="createBtn"
          onClick={() => {
            setNewPost(false);
            setNewGroup(false); // Reset newGroup when toggling newPost
            setCreate(!create);
          }}
        >
          <CreateIcon />
        </button>
        {create ? (
          <div className="createButtons">
            <button onClick={() => {
              newGroup ? setNewGroup(false) : null
              setNewPost(!newPost)
            }}>New Post</button>
            <button onClick={() => {
              newPost ? setNewPost(false) : null
              setNewGroup(!newGroup)
            }}>New Group</button>
          </div>
        ) : null}
      </div >
      {create && newPost ? <AddPost isOpen={newPost} onClose={close} /> : null
      }
      {create && newGroup ? <CreateGroupModal onClose={close} /> : null}    </>
  );
}

export default CreateButton;
