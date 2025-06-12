"use client";

import type React from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Hash,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

interface ConversationDetailProps {
  vcon: Doc<"vcons">;
  isExpanded: boolean;
  onToggle: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({
  vcon,
  isExpanded,
  onToggle,
}) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPartyColor = (partyIndex: number) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ];
    return colors[partyIndex % colors.length];
  };

  const getMessageAlignment = (originator: number) => {
    return originator === 0 ? "justify-start" : "justify-end";
  };

  const getMessageStyle = (originator: number) => {
    return originator === 0
      ? "bg-gray-100 text-gray-800 rounded-br-lg rounded-t-lg"
      : "bg-blue-500 text-white rounded-bl-lg rounded-t-lg";
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600 bg-green-50";
      case "neutral":
        return "text-yellow-600 bg-yellow-50";
      case "negative":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-blue-500" />
          <div className="text-left">
            <h4 className="font-medium text-gray-800">Conversation Details</h4>
            <p className="text-sm text-gray-600">
              {vcon.parties.length} participants • {vcon.dialog.length} messages
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={16} />
                General Information
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">vCon ID:</span>
                  <span className="font-mono text-xs">
                    {vcon.uuid.slice(0, 8)}...
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span>{vcon}</span>
                </div> */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{formatTimestamp(vcon.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages:</span>
                  <span>{vcon.analysis?.[0].body.length}</span>
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            {vcon.analysis && (
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Hash size={16} />
                  Analysis
                </h5>
                <div className="space-y-2">
                  {vcon.analysis?.[1].body.sentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Sentiment:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(
                          vcon.analysis?.[1].body.sentiment.type
                        )}`}
                      >
                        {vcon.analysis?.[1].body.sentiment.type}
                      </span>
                    </div>
                  )}
                  {vcon.analysis?.[0].body.summary && (
                    <div>
                      <span className="text-sm text-gray-600">
                        Issues rasied:
                      </span>
                      <p className="text-sm text-gray-800 mt-1">
                        {vcon.analysis?.[1].body.issues_raised}
                      </p>
                    </div>
                  )}
                  {vcon.analysis?.[0].body.keywords &&
                    vcon.analysis?.[0].body.keywords.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Keywords:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vcon.analysis?.[0].body.keywords.map(
                            (keyword: string, index: number) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium"
                              >
                                {keyword}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  {/* {vcon.analysis.topics && vcon.analysis.topics.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Topics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vcon.analysis.topics.map((topic, index) => (
                          <span
                            key={index}
                            className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <Users size={16} />
              Participants
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vcon.parties.map((party, index) => (
                <div
                  key={party.name}
                  className={`p-3 rounded-lg border ${getPartyColor(index)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{party.name}</span>
                    <span className="text-xs px-2 py-1 bg-white/50 rounded-full">
                      {party.meta.role}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {party.mailto && (
                      <div className="flex items-center gap-1">
                        <Mail size={12} />
                        <span>{party.mailto}</span>
                      </div>
                    )}
                    {party.tel && (
                      <div className="flex items-center gap-1">
                        <Phone size={12} />
                        <span>{party.tel}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Dialog */}
          <div className="space-y-3">
            <h5 className="font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare size={16} />
              Conversation
            </h5>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {vcon.analysis?.[0].body.map(
                  (
                    message: { speaker: string; message: string },
                    index: number
                  ) => {
                    const party =
                      message.speaker.toLowerCase() === "agent" ? 1 : 0;
                    return (
                      <div
                        key={index}
                        className={`flex ${getMessageAlignment(party)}`}
                      >
                        <div className="max-w-[80%]">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getPartyColor(
                                party
                              )}`}
                            >
                              {message.speaker}
                            </span>
                            {/* <span className="text-xs text-gray-500">
                              {formatTime(message.start)}
                            </span> */}
                          </div>
                          <div className={`p-3 ${getMessageStyle(party)}`}>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationDetail;
