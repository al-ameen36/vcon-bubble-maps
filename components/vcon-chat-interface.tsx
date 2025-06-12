"use client";

import type React from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Hash,
  TrendingUp,
} from "lucide-react";
import { Doc } from "@/convex/_generated/dataModel";

interface VConChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  vcon: Doc<"vcons"> | null;
  conversationName: string;
}

const VConChatInterface: React.FC<VConChatInterfaceProps> = ({
  isOpen,
  onClose,
  onBack,
  vcon,
  conversationName,
}) => {
  if (!isOpen || !vcon) return null;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine if participant is a bot and replace name if needed
  const getDisplayName = (party: any, index: number) => {
    const isBot =
      party.role?.toLowerCase().includes("bot") ||
      party.role?.toLowerCase().includes("agent") ||
      party.role?.toLowerCase().includes("assistant") ||
      party.name?.toLowerCase().includes("bot") ||
      party.name?.toLowerCase().includes("agent");

    if (isBot) {
      return party.name;
    }

    // If not a bot, replace with generic name but keep original for contact info
    return index === 0 ? "User" : `User ${index + 1}`;
  };

  const getPartyColor = (partyIndex: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    return colors[partyIndex % colors.length];
  };

  const getPartyLightColor = (partyIndex: number) => {
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

  const conversationDuration = () => {
    if (vcon.dialog.length < 2) return "0 min";
    const start = new Date(vcon.dialog[0].start);
    const end = new Date(vcon.dialog[vcon.dialog.length - 1].start);
    const diffMinutes = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60)
    );
    return `${diffMinutes} min`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Chat Interface */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header with General Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
            {/* Navigation and Title */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  aria-label="Back to category"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {conversationName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Virtual Conversation Overview
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-500" size={16} />
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">
                    {formatTimestamp(vcon.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-green-500" size={16} />
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{conversationDuration()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-purple-500" size={16} />
                <div>
                  <p className="text-gray-600">Participants</p>
                  <p className="font-medium">{vcon.parties.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="text-orange-500" size={16} />
                <div>
                  <p className="text-gray-600">Messages</p>
                  <p className="font-medium">
                    {vcon.analysis?.[0].body.length}
                  </p>
                </div>
              </div>
            </div>

            {/* vCon Technical Info */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-600">vCon ID</p>
                <p className="font-mono text-xs bg-white/50 px-2 py-1 rounded">
                  {vcon.uuid}
                </p>
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Users size={16} />
                Participants
              </h3>
              <div className="flex flex-wrap gap-3">
                {vcon.parties.map((party, index) => (
                  <div
                    key={party.name}
                    className={`px-3 py-2 rounded-lg ${getPartyLightColor(
                      index
                    )}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${getPartyColor(
                          index
                        )}`}
                      ></div>
                      <div>
                        <p className="font-medium text-sm">
                          {getDisplayName(party, index)}
                        </p>
                        <p className="text-xs opacity-75">{party.meta.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {party.mailto && (
                            <div className="flex items-center gap-1">
                              <Mail size={10} />
                              <span className="text-xs">{party.mailto}</span>
                            </div>
                          )}
                          {party.tel && (
                            <div className="flex items-center gap-1">
                              <Phone size={10} />
                              <span className="text-xs">{party.tel}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Section */}
            {vcon.analysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Analysis
                  </h3>
                  {vcon.analysis?.[1].body.sentiment && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        VCon Sentiment:
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(
                          vcon.analysis?.[1].body.sentiment.type
                        )}`}
                      >
                        {vcon.analysis?.[1].body.sentiment.type}
                      </span>
                    </div>
                  )}
                  {vcon.analysis?.[1].body.issues_raised && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Issue rasied:
                      </span>
                      <p className="text-sm text-gray-700">
                        {vcon.analysis?.[1].body.issues_raised}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Hash size={16} />
                    Keywords & Topics
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {vcon.analysis?.[1].body.keywords?.map(
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
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-4 max-w-4xl mx-auto">
              {vcon.analysis?.[0].body.map(
                (
                  message: { speaker: string; message: string },
                  index: number
                ) => {
                  const party =
                    message.speaker.toLowerCase() === "agent" ? 0 : 1;
                  const displayName = getDisplayName(party, party);
                  const isFirstParty = party === 0;

                  return (
                    <div
                      key={index}
                      className={`flex ${
                        isFirstParty ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isFirstParty ? "order-1" : "order-2"
                        }`}
                      >
                        {/* Message Header */}
                        <div
                          className={`flex items-center gap-2 mb-1 ${
                            isFirstParty ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 ${
                              isFirstParty ? "flex-row" : "flex-row-reverse"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full ${getPartyColor(
                                party
                              )} flex items-center justify-center`}
                            >
                              <span className="text-white text-xs font-bold">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                getPartyLightColor(party).split(" ")[1]
                              }`}
                            >
                              {displayName}
                            </span>
                          </div>
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`p-3 rounded-lg ${
                            isFirstParty
                              ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                              : `${getPartyColor(
                                  party
                                )} text-white rounded-tr-sm`
                          }`}
                        >
                          <p className="text-sm leading-relaxed">
                            {message.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>vCon ID: {vcon.uuid}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VConChatInterface;
