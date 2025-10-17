"use client"
import ChatUI from "@/components/chat-interface/ChatUI";
import {socket} from "@/socket";
import { useRef, useState } from "react";

export default function Home() {
  const [groupJoined, setGroupJoined] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
    const inputNameRef = useRef<HTMLInputElement | null>(null);

  function joinGroup(groupName: string, userName: string | null) {
    socket.emit("join_group", {groupName, userName});
  }
  function handleGroupClicked(groupName: string) {
    joinGroup(groupName, userName);
    setGroupJoined(true);
    setGroupName(groupName);
  }
  return (
    <div className="w-full flex">
      {!userName && (
        <div className="absolute w-full h-full inset-0 bg-gray-500/50 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-xl bg-white p-6 rounded-md shadow-md">
            <h3 className="font-semibold">Enter your name to Join the Chat</h3>
            <p className="text-sm text-gray-500 mt-1">This will be your display name in the chat.</p>
            <input
              ref={inputNameRef}
              type="text"
              placeholder="Enter your name"
              className="border p-2 rounded-md w-full my-4"
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2"
              onClick={() => {
                if (inputNameRef.current?.value) {
                  setUserName(inputNameRef.current.value);
                }
              }}
            >
              Set Name
            </button>
          </div>
        </div>
      )}
      <div className="w-2/3 p-4">
        <h2 className="font-semibold">List of Groups</h2>
        <ul className="pl-5 cursor-pointer">
          <li className="p-2 px-4 hover:bg-gray-300 rounded-md" onClick={() => handleGroupClicked("Group 1")}>Group 1</li>
          <li className="p-2 px-4 hover:bg-gray-300 rounded-md" onClick={() => handleGroupClicked("Group 2")}>Group 2</li>
          <li className="p-2 px-4 hover:bg-gray-300 rounded-md" onClick={() => handleGroupClicked("Group 3")}>Group 3</li>
        </ul>
      </div>
      {groupJoined ? <ChatUI groupName={groupName} userName={userName} /> : <div className="w-1/3 p-4 flex items-center justify-center">
        <h2 className="font-semibold text-gray-500">Join a group to start chatting</h2>
      </div>}
    </div>
  );
}
