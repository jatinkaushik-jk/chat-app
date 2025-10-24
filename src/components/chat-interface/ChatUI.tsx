"use client";
import React, { useEffect, useRef, useState } from "react";
import { socket } from "@/socket";

type Message = {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
};

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Hey! Welcome to the chat — this is a demo of a WhatsApp-like UI.",
    sender: "other",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "2",
    text: "It supports grouped messages, date separators and an input area.",
    sender: "other",
    timestamp: Date.now() - 1000 * 60 * 60 * 23,
  },
  {
    id: "3",
    text: "Type something below and press Enter to send. Shift+Enter inserts a newline.",
    sender: "me",
    timestamp: Date.now() - 1000 * 60 * 60,
  },
];

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return "Today";
  }
  return d.toLocaleDateString();
}

const ChatUI = ({
  groupName,
  userName,
}: {
  groupName: string | null;
  userName: string | null;
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNewUserJoined, setIsNewUserJoined] = useState(false);
  const [newUserName, setNewUserName] = useState<string | null>(null);
  const typingTimeoutId = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (socket.connected) {
      console.log("Socket is connected");
    }
    socket.on("receive_message", (msg) => {
      setMessages((m) => [...m, msg]);
    });
    socket.on("user_joined", (userName: string) => {
      setIsNewUserJoined(true);
      setNewUserName(userName);
      setTimeout(() => setIsNewUserJoined(false), 5000);
    });

    socket.on("user_typing", (userName: string) => {
      setIsTyping(true);
      setTypingUsers((prev) => {
        if (!prev.includes(userName)) {
          return [...prev, userName];
        }
        return prev;
      });
    });

    socket.on("user_stop_typing", (userName: string) => {
      setIsTyping(false);
      setTypingUsers((prev) => prev.filter((u) => u !== userName));
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_joined");
      socket.off("user_typing");
      socket.off("user_stop_typing");
    };
  }, []);

  useEffect(() => {
    if (text.length > 0) {
      socket.emit("typing");
      // clear previous timeout | Debounce
      clearTimeout(typingTimeoutId.current);

      // set new timeout to emit stop_typing after 1 second of inactivity
      typingTimeoutId.current = setTimeout(() => {
        socket.emit("stop_typing");
      }, 1000);
    }
  }, [text]);

  useEffect(() => {
    // scroll to bottom when messages change
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const msg: Message = {
      id: String(Date.now()),
      text: text,
      sender: userName || "me",
      timestamp: Date.now(),
    };
    socket.emit("send_message", msg);
    setMessages((m) => [...m, msg]);
    setText("");
    setIsTyping(false);
    // // fake reply after a short delay to show other-sender style
    // setTimeout(() => {
    //   const reply: Message = {
    //     id: String(Date.now() + 1),
    //     text: "Nice — got your message! (automated reply)",
    //     sender: "other",
    //     timestamp: Date.now() + 500,
    //   }
    //   setMessages((m) => [...m, reply])
    // }, 800)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // group messages by date
  const groups = messages.reduce<Record<string, Message[]>>((acc, msg) => {
    const dateKey = formatDate(msg.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const dateKeys = Object.keys(groups);

  return (
    <>
      <div className="h-screen w-full flex flex-col rounded-xl overflow-hidden shadow-lg bg-[#e5ddd5] font-sans">
        <header className="h-16 flex items-center justify-between px-3 bg-white/60 border-b border-black/5">
          <div className="flex items-center">
            <div className="w-11 h-11 rounded-full bg-blue-400 text-white flex items-center justify-center font-semibold mr-3">
              G
            </div>
            <div className="flex flex-col">
              <div className="font-medium">{groupName}</div>
              <div className="text-sm text-gray-500">online</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="bg-transparent border-0 p-2 rounded-md hover:bg-black/5"
              aria-label="Search"
            >
              🔍
            </button>
            <button
              className="bg-transparent border-0 p-2 rounded-md hover:bg-black/5"
              aria-label="More"
            >
              ⋮
            </button>
          </div>
        </header>

        <div
          className="flex-1 overflow-auto p-4 flex flex-col gap-2"
          ref={containerRef}
        >
          {dateKeys.map((dateKey) => (
            <div key={dateKey} className="flex flex-col gap-2">
              <div className="self-center bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-800 max-w-[70%] text-center">
                {dateKey}
              </div>
              {groups[dateKey].map((msg) => (
                <div
                  key={msg.id}
                  className={`flex max-w-[85%] ${
                    msg.sender === userName
                      ? "self-end justify-end"
                      : "self-start"
                  }`}
                >
                  <div className="w-8 h-8 aspect-square rounded-full bg-blue-400 text-white flex items-center text-xs justify-center font-semibold mr-3">
                    {msg.sender.charAt(0).toUpperCase()}
                  </div>
                  <div
                    className={`p-2 rounded-lg shadow-sm ${
                      msg.sender === userName ? "bg-[#dcf8c6]" : "bg-white"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {isTyping && typingUsers && (
            <div className="text-sm text-gray-500 p-1">
              {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"}{" "}
              typing…
            </div>
          )}
          {isNewUserJoined && (
            <div className="text-sm text-gray-500 p-1">
              {newUserName} has joined the chat.
            </div>
          )}
        </div>

        <div className="flex p-2 border-t bg-gray-100 items-end gap-2">
          <textarea
            className="flex-1 min-h-[38px] max-h-[140px] p-2 rounded border resize-none text-sm bg-white"
            placeholder="Type a message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="flex items-center">
            <button
              className="bg-[#128C7E] text-white px-3 py-2 rounded-md"
              onClick={sendMessage}
              aria-label="Send message"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatUI;
