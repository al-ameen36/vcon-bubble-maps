"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  BarChart2,
  List,
  PieChart,
  Info,
  Zap,
  ZapOff,
} from "lucide-react"

interface ItemData {
  name: string
  category: string
  [key: string]: any
}

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
}

interface QuickQuestion {
  id: string
  text: string
  question: string
  icon: React.ReactNode
}

interface ChatbotProps {
  filteredItems: ItemData[]
  selectedCategories: Set<string>
}

const Chatbot: React.FC<ChatbotProps> = ({ filteredItems, selectedCategories }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "bot",
      content: "Hi! I can help you analyze the items in your selected categories. Ask me anything about the data!",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickQuestions, setShowQuickQuestions] = useState(true)
  const [hasUserSentMessage, setHasUserSentMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Define quick questions
  const quickQuestions: QuickQuestion[] = [
    {
      id: "total",
      text: "Total items",
      question: "How many items are there in total?",
      icon: <Info size={14} />,
    },
    {
      id: "largest",
      text: "Largest category",
      question: "What's the largest category?",
      icon: <BarChart2 size={14} />,
    },
    {
      id: "compare",
      text: "Compare categories",
      question: "Compare all categories",
      icon: <PieChart size={14} />,
    },
    {
      id: "list",
      text: "List categories",
      question: "List all categories",
      icon: <List size={14} />,
    },
    {
      id: "help",
      text: "Help",
      question: "What can you help me with?",
      icon: <HelpCircle size={14} />,
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Auto-hide quick questions after user sends first message
  useEffect(() => {
    if (hasUserSentMessage && showQuickQuestions) {
      const timer = setTimeout(() => {
        setShowQuickQuestions(false)
      }, 500) // Small delay for smooth UX
      return () => clearTimeout(timer)
    }
  }, [hasUserSentMessage, showQuickQuestions])

  const generateResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase()
    const categories = Array.from(selectedCategories)
    const totalItems = filteredItems.length

    // Get category counts
    const categoryCounts = filteredItems.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Simple response logic based on keywords
    if (lowerMessage.includes("how many") || lowerMessage.includes("count") || lowerMessage.includes("total items")) {
      if (lowerMessage.includes("total")) {
        return `You currently have ${totalItems} items selected across ${
          selectedCategories.size === 0 ? "all" : selectedCategories.size
        } categories.`
      }
      const categoryBreakdown = Object.entries(categoryCounts)
        .map(([cat, count]) => `${cat}: ${count} items`)
        .join(", ")
      return `Here's the breakdown: ${categoryBreakdown}`
    }

    if (
      lowerMessage.includes("categories") ||
      lowerMessage.includes("category") ||
      lowerMessage.includes("list all categories")
    ) {
      if (categories.length === 0) {
        const allCategories = Object.keys(categoryCounts).join(", ")
        return `All categories are currently selected: ${allCategories}`
      }
      return `You're currently viewing: ${categories.join(", ")}. These categories contain ${totalItems} items total.`
    }

    if (
      lowerMessage.includes("largest") ||
      lowerMessage.includes("biggest") ||
      lowerMessage.includes("what's the largest category")
    ) {
      const largest = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
      return largest ? `The largest category is "${largest[0]}" with ${largest[1]} items.` : "No categories selected."
    }

    if (lowerMessage.includes("smallest") || lowerMessage.includes("least")) {
      const smallest = Object.entries(categoryCounts).sort((a, b) => a[1] - b[1])[0]
      return smallest
        ? `The smallest category is "${smallest[0]}" with ${smallest[1]} items.`
        : "No categories selected."
    }

    if (lowerMessage.includes("items") && lowerMessage.includes("in")) {
      const categoryMatch = categories.find((cat) => lowerMessage.includes(cat.toLowerCase()))
      if (categoryMatch) {
        const categoryItems = filteredItems.filter((item) => item.category === categoryMatch)
        const itemNames = categoryItems.map((item) => item.name).join(", ")
        return `Items in ${categoryMatch}: ${itemNames}`
      }
    }

    if (lowerMessage.includes("compare") || lowerMessage.includes("compare all categories")) {
      const allCategories = Object.keys(categoryCounts)
      if (allCategories.length < 2) {
        return "You need at least 2 categories to make comparisons."
      }
      const comparison = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, count]) => `${cat} (${count})`)
        .join(" > ")
      return `Category comparison by size: ${comparison}`
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("what can")) {
      return `I can help you with:
• Count items in categories
• Compare category sizes
• List items in specific categories
• Find largest/smallest categories
• Analyze your current selection

Try asking: "How many items are in Frontend?" or "Compare my categories"`
    }

    // Default responses
    const responses = [
      `Based on your current selection of ${totalItems} items across ${
        selectedCategories.size === 0 ? "all" : selectedCategories.size
      } categories, what specific aspect would you like to explore?`,
      `I can see you have ${
        selectedCategories.size === 0 ? "all categories" : Array.from(selectedCategories).join(", ")
      } selected. What would you like to know about these categories?`,
      `Your current data includes ${totalItems} items. Try asking about counts, comparisons, or specific categories!`,
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async (message: string = inputValue.trim()) => {
    if (!message) return

    // Mark that user has sent a message
    if (!hasUserSentMessage) {
      setHasUserSentMessage(true)
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate typing delay
    setTimeout(
      () => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: "bot",
          content: generateResponse(userMessage.content),
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, botResponse])
        setIsTyping(false)
      },
      1000 + Math.random() * 1000,
    ) // 1-2 second delay
  }

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleQuickQuestions = () => {
    setShowQuickQuestions(!showQuickQuestions)
  }

  const hideQuickQuestions = () => {
    setShowQuickQuestions(false)
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-105 ${
          isOpen ? "right-96" : "right-4"
        }`}
        aria-label="Toggle chatbot"
      >
        <MessageCircle size={24} />
        {!isOpen && <span className="absolute -top-1 -left-1 bg-green-500 w-3 h-3 rounded-full animate-pulse"></span>}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed top-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-2xl transition-all duration-300 ${
          isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        }`}
        style={{ width: "380px", height: "calc(100vh - 32px)" }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-500 rounded-full p-2">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Data Assistant</h3>
                <p className="text-xs text-gray-500">
                  {selectedCategories.size === 0 ? "All categories" : `${selectedCategories.size} categories selected`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Quick Questions Toggle */}
              <button
                onClick={toggleQuickQuestions}
                className={`p-2 rounded-lg transition-colors ${
                  showQuickQuestions
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                title={showQuickQuestions ? "Hide quick questions" : "Show quick questions"}
                aria-label={showQuickQuestions ? "Hide quick questions" : "Show quick questions"}
              >
                {showQuickQuestions ? <ZapOff size={16} /> : <Zap size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === "bot" && <Bot size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />}
                    {message.type === "user" && <User size={16} className="text-white mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot size={16} className="text-blue-500" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {showQuickQuestions && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Quick questions:</p>
                <button
                  onClick={hideQuickQuestions}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Hide quick questions"
                  aria-label="Hide quick questions"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuickQuestion(q.question)}
                    disabled={isTyping}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {q.icon}
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your data..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg px-4 py-2 transition-colors"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/10 z-30" onClick={() => setIsOpen(false)} />}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </>
  )
}

export default Chatbot
