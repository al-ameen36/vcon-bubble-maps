"use client";

import { api } from "@/convex/_generated/api";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { User } from "lucide-react";
import { useEffect } from "react";

type Props = {
  threadId: string;
};

export default function Thread({ threadId }: Props) {
  const messages = useThreadMessages(
    api.agents.agent.listThreadMessages,
    { threadId },
    { initialNumItems: 10 }
  );

  return (
    <>
      {toUIMessages(messages.results ?? []).map((message) => (
        <div
          key={message.id}
          className={`flex ${
            // message.type === "user" ? "justify-end" : "justify-start"
            ""
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg p-3 ${
              //   message.type === "user"
              //     ? "bg-blue-500 text-white"
              //     : "bg-gray-100 text-gray-800"
              ""
            }`}
          >
            <div className="flex items-start space-x-2">
              {/* {message.type === "bot" && (
                <Bot size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              )} */}
              {/* {message.type === "user" && ( */}
              <User size={16} className="text-white mt-0.5 flex-shrink-0" />
              {/* )} */}
              <div className="flex-1">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    // message.type === "user" ? "text-blue-100" : "text-gray-500"
                    ""
                  }`}
                >
                  {message.createdAt?.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
