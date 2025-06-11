"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { X, Calendar, Clock, Users, MessageSquare, TrendingUp, Hash, Search } from "lucide-react"
import type { ItemData } from "./circle-data"
import ConversationDetail from "./conversation-detail"
import VConChatInterface from "./vcon-chat-interface"

interface BubbleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  categoryData: {
    category: string
    items: ItemData[]
    totalDuration: number
    avgDuration: number
    totalParticipants: number
    avgParticipants: number
    sentimentBreakdown: {
      positive: number
      neutral: number
      negative: number
    }
    topKeywords: { keyword: string; count: number }[]
    recentItems: ItemData[]
  } | null
}

const BubbleDetailModal: React.FC<BubbleDetailModalProps> = ({ isOpen, onClose, categoryData }) => {
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [conversationSearchTerm, setConversationSearchTerm] = useState("")
  const [selectedVCon, setSelectedVCon] = useState<ItemData | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(true)

  // Filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (!categoryData) return []
    if (!conversationSearchTerm.trim()) return categoryData.items

    const searchLower = conversationSearchTerm.toLowerCase()
    return categoryData.items.filter((item) => {
      // Search in conversation name
      if (item.name.toLowerCase().includes(searchLower)) return true

      // Search in conversation content
      if (item.content?.toLowerCase().includes(searchLower)) return true

      // Search in keywords
      if (item.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))) return true

      // Search in vCon dialog content
      if (item.vcon?.dialog.some((message) => message.body.toLowerCase().includes(searchLower))) return true

      // Search in vCon participant names
      if (item.vcon?.parties.some((party) => party.name.toLowerCase().includes(searchLower))) return true

      // Search in vCon analysis
      if (item.vcon?.analysis?.summary?.toLowerCase().includes(searchLower)) return true
      if (item.vcon?.analysis?.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))) return true
      if (item.vcon?.analysis?.topics?.some((topic) => topic.toLowerCase().includes(searchLower))) return true

      return false
    })
  }, [categoryData, conversationSearchTerm])

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-500"
      case "neutral":
        return "text-yellow-500"
      case "negative":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100"
      case "neutral":
        return "bg-yellow-100"
      case "negative":
        return "bg-red-100"
      default:
        return "bg-gray-100"
    }
  }

  const toggleConversationExpansion = (conversationId: string) => {
    const newExpanded = new Set(expandedConversations)
    if (newExpanded.has(conversationId)) {
      newExpanded.delete(conversationId)
    } else {
      newExpanded.add(conversationId)
    }
    setExpandedConversations(newExpanded)
  }

  const handleConversationClick = (item: ItemData) => {
    console.log("handleConversationClick called with:", item) // Debug log
    console.log("Item has vcon:", !!item.vcon) // Debug log

    // All conversations should have vCon data as per requirements
    if (item.vcon) {
      console.log("Setting selected vcon and hiding category modal") // Debug log
      setSelectedVCon(item)
      setShowCategoryModal(false)
    } else {
      console.log("No vcon data found for item:", item.name) // Debug log
    }
  }

  const handleBackToCategory = () => {
    setSelectedVCon(null)
    setShowCategoryModal(true)
  }

  const handleCloseAll = () => {
    setSelectedVCon(null)
    setShowCategoryModal(true)
    onClose()
  }

  const conversationsWithVcon = filteredConversations.filter((item) => item.vcon)

  if (!isOpen) return null

  return (
    <>
      {/* Category Modal */}
      {showCategoryModal && !selectedVCon && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{categoryData?.category}</h2>
                  <p className="text-gray-600">
                    {categoryData?.items.length} conversations • {conversationsWithVcon.length} with detailed records
                    {conversationSearchTerm && (
                      <span className="ml-2 text-blue-600">• {filteredConversations.length} matching search</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-blue-500" size={20} />
                      <span className="text-sm font-medium text-gray-600">Total Duration</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{categoryData?.totalDuration}m</p>
                    <p className="text-xs text-gray-500">Avg: {categoryData?.avgDuration}m</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="text-green-500" size={20} />
                      <span className="text-sm font-medium text-gray-600">Participants</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{categoryData?.totalParticipants}</p>
                    <p className="text-xs text-gray-500">Avg: {categoryData?.avgParticipants}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="text-purple-500" size={20} />
                      <span className="text-sm font-medium text-gray-600">Conversations</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{categoryData?.items.length}</p>
                    <p className="text-xs text-gray-500">{conversationsWithVcon.length} detailed</p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="text-orange-500" size={20} />
                      <span className="text-sm font-medium text-gray-600">Sentiment Score</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {categoryData?.items.length > 0
                        ? Math.round(
                            ((categoryData?.sentimentBreakdown.positive * 1 +
                              categoryData?.sentimentBreakdown.neutral * 0.5 +
                              categoryData?.sentimentBreakdown.negative * 0) /
                              categoryData?.items.length) *
                              100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Sentiment Breakdown */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Sentiment Analysis</h3>
                    <div className="space-y-3">
                      {Object.entries(categoryData?.sentimentBreakdown || {}).map(([sentiment, count]) => (
                        <div key={sentiment} className="flex items-center justify-between">
                          <span className={`capitalize font-medium ${getSentimentColor(sentiment)}`}>{sentiment}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getSentimentBg(sentiment)}`}
                                style={{
                                  width: `${
                                    categoryData?.items.length > 0 ? (count / categoryData?.items.length) * 100 : 0
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Keywords */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      <Hash size={20} className="inline mr-2" />
                      Top Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {categoryData?.topKeywords.map(({ keyword, count }) => (
                        <span
                          key={keyword}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {keyword} ({count})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conversations Search and List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      <MessageSquare size={20} className="inline mr-2" />
                      Conversations
                    </h3>
                    <span className="text-sm text-gray-500">
                      {filteredConversations.length} of {categoryData?.items.length} conversations
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search conversations, content, participants, keywords..."
                      value={conversationSearchTerm}
                      onChange={(e) => setConversationSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {conversationSearchTerm && (
                      <button
                        onClick={() => setConversationSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Conversations List */}
                  <div className="space-y-3">
                    {filteredConversations.length > 0 ? (
                      filteredConversations.map((item) => (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          {/* Conversation Header */}
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log("Conversation clicked:", item.name, item.vcon) // Debug log
                              handleConversationClick(item)
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                {item.name}
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                                  View Chat
                                </span>
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentBg(item.sentiment || "neutral")} ${getSentimentColor(item.sentiment || "neutral")}`}
                              >
                                {item.sentiment}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{item.content}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {item.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {item.duration}m
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {item.participants}
                              </span>
                            </div>
                            {item.keywords && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.keywords.map((keyword) => (
                                  <span key={keyword} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Expandable Conversation Detail */}
                          {item.vcon && (
                            <ConversationDetail
                              vcon={item.vcon}
                              isExpanded={expandedConversations.has(item.id)}
                              onToggle={() => toggleConversationExpansion(item.id)}
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No conversations found</p>
                        <p className="text-sm">
                          {conversationSearchTerm
                            ? `No conversations match "${conversationSearchTerm}"`
                            : "No conversations available in this category"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* vCon Chat Interface */}
      {console.log("Rendering VConChatInterface:", {
        selectedVCon: !!selectedVCon,
        showCategoryModal,
        shouldShow: !!selectedVCon && !showCategoryModal,
      })}
      <VConChatInterface
        isOpen={!!selectedVCon && !showCategoryModal}
        onClose={handleCloseAll}
        onBack={handleBackToCategory}
        vcon={selectedVCon?.vcon || null}
        conversationName={selectedVCon?.name || ""}
      />
    </>
  )
}

export default BubbleDetailModal
