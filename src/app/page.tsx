"use client";
import ChatUI from "@/components/chat-interface/ChatUI";
import { socket } from "@/socket";
import { useRef, useState } from "react";

export default function Home() {
  const [groupJoined, setGroupJoined] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const inputNameRef = useRef<HTMLInputElement | null>(null);

  function joinGroup(groupName: string, userName: string | null) {
    socket.emit("join_group", { groupName, userName });
  }
  function handleGroupClicked(groupName: string) {
    joinGroup(groupName, userName);
    setGroupJoined(true);
    setGroupName(groupName);
  }
  return (
    <div className="w-full flex h-screen">
      {!userName && (
        <div className="absolute w-full h-full inset-0 bg-gray-500/50 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-xl bg-white p-6 rounded-md shadow-md">
            <h3 className="font-semibold">Enter your name to Join the Chat</h3>
            <p className="text-sm text-gray-500 mt-1">
              This will be your display name in the chat.
            </p>
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
      <div className="w-1/3 p-4 border-r overflow-auto">
        <h2 className="font-semibold mb-3">Chats</h2>
        <div className="space-y-3">
          {[
            { name: "Group 1", last: "Hey, are we meeting today?", time: "9:12 AM", unread: 2 },
            { name: "Group 2", last: "I'll upload the files shortly", time: "Yesterday", unread: 0 },
            { name: "Group 3", last: "Nice work on the PR ✅", time: "Mon", unread: 5 },
          ].map((g) => (
            <div
              key={g.name}
              className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer ${groupName === g.name ? 'bg-gray-100' : ''}`}
              onClick={() => handleGroupClicked(g.name)}
            >
              <div className="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center text-white font-semibold">{g.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <div className="font-medium truncate">{g.name}</div>
                  <div className="text-xs text-gray-400 ml-2">{g.time}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 truncate">{g.last}</div>
                  {g.unread > 0 && (
                    <div className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">{g.unread}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {groupJoined ? (
        <div className="w-2/3"><ChatUI groupName={groupName} userName={userName} /></div>
      ) : (
        <div className="w-2/3 p-4 flex items-center justify-center">
          <h2 className="font-semibold text-gray-500">
            Join a group to start chatting
          </h2>
        </div>
      )}
    </div>
  );
}
