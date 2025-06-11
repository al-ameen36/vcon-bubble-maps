"use client"

import type React from "react"
import { useState, useMemo } from "react"

import { Filter, X, RotateCcw, CheckSquare, Search, Calendar, Smile, Meh, Frown } from "lucide-react"

interface CategoryData {
  category: string
  count: number
  isSelected: boolean
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
}

interface FilterPanelProps {
  categoryData: CategoryData[]
  isOpen: boolean
  onToggleOpen: () => void
  onCategoryToggle: (category: string) => void
  onResetFilters: () => void
  onSelectAll: () => void
  selectedCount: number
  totalCount: number
  onContentSearch: (term: string) => void
  onDateRangeChange: (startDate: string, endDate: string) => void
  onSentimentFilter: (sentiments: string[]) => void
  contentSearchTerm: string
  dateRange: { start: string; end: string }
  selectedSentiments: string[]
}

const EnhancedFilterPanel: React.FC<FilterPanelProps> = ({
  categoryData,
  isOpen,
  onToggleOpen,
  onCategoryToggle,
  onResetFilters,
  onSelectAll,
  selectedCount,
  totalCount,
  onContentSearch,
  onDateRangeChange,
  onSentimentFilter,
  contentSearchTerm,
  dateRange,
  selectedSentiments,
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [localContentSearch, setLocalContentSearch] = useState(contentSearchTerm)
  const [localDateRange, setLocalDateRange] = useState(dateRange)

  const filteredCategoryData = useMemo(() => {
    if (!searchTerm.trim()) return categoryData
    return categoryData.filter((item) => item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [categoryData, searchTerm])

  const handleContentSearchChange = (value: string) => {
    setLocalContentSearch(value)
    onContentSearch(value)
  }

  const handleDateRangeChange = (field: "start" | "end", value: string) => {
    const newRange = { ...localDateRange, [field]: value }
    setLocalDateRange(newRange)
    onDateRangeChange(newRange.start, newRange.end)
  }

  const handleSentimentToggle = (sentiment: string) => {
    const newSentiments = selectedSentiments.includes(sentiment)
      ? selectedSentiments.filter((s) => s !== sentiment)
      : [...selectedSentiments, sentiment]
    onSentimentFilter(newSentiments)
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile size={14} className="text-green-500" />
      case "neutral":
        return <Meh size={14} className="text-yellow-500" />
      case "negative":
        return <Frown size={14} className="text-red-500" />
      default:
        return null
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "border-green-400 bg-green-50"
      case "neutral":
        return "border-yellow-400 bg-yellow-50"
      case "negative":
        return "border-red-400 bg-red-50"
      default:
        return "border-gray-400 bg-gray-50"
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggleOpen}
        className={`fixed top-4 z-50 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg p-3 text-white hover:bg-white/30 transition-all duration-300 shadow-lg ${
          isOpen ? "left-80" : "left-4"
        }`}
        aria-label="Toggle filter panel"
      >
        <Filter size={20} />
        {selectedCount > 0 && selectedCount < totalCount && (
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      <div
        className={`fixed top-4 left-4 z-40 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl transition-all duration-300 ${
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
        style={{ width: "320px", height: "calc(100vh - 32px)" }}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-lg">Advanced Filters</h3>
            <button
              onClick={onToggleOpen}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close filter panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Search */}
          <div className="mb-4">
            <label className="block text-white/80 text-sm font-medium mb-2">Search Content</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Search in conversations..."
                value={localContentSearch}
                onChange={(e) => handleContentSearchChange(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
              {localContentSearch && (
                <button
                  onClick={() => handleContentSearchChange("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="mb-4">
            <label className="block text-white/80 text-sm font-medium mb-2">
              <Calendar size={14} className="inline mr-1" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={localDateRange.start}
                onChange={(e) => handleDateRangeChange("start", e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
              <input
                type="date"
                value={localDateRange.end}
                onChange={(e) => handleDateRangeChange("end", e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sentiment Filter */}
          <div className="mb-4">
            <label className="block text-white/80 text-sm font-medium mb-2">Sentiment</label>
            <div className="flex gap-2">
              {["positive", "neutral", "negative"].map((sentiment) => (
                <button
                  key={sentiment}
                  onClick={() => handleSentimentToggle(sentiment)}
                  className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                    selectedSentiments.includes(sentiment) ? getSentimentColor(sentiment) : "border-white/20 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {getSentimentIcon(sentiment)}
                    <span className="text-xs text-white capitalize">{sentiment}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={onSelectAll}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-white text-sm py-2 px-3 rounded-lg transition-colors border border-blue-400/30"
            >
              <CheckSquare size={14} className="inline mr-1" />
              Select All
            </button>
            <button
              onClick={onResetFilters}
              className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-white text-sm py-2 px-3 rounded-lg transition-colors border border-red-400/30"
            >
              <RotateCcw size={14} className="inline mr-1" />
              Reset
            </button>
          </div>

          {/* Category Search */}
          <div className="mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Status */}
          <div className="mb-4 text-white/80 text-sm">
            {selectedCount === 0 ? (
              <span>Showing all categories ({totalCount})</span>
            ) : (
              <span>
                Showing {selectedCount} of {totalCount} categories
              </span>
            )}
          </div>

          {/* Category List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              {filteredCategoryData.length > 0 ? (
                filteredCategoryData.map(({ category, count, isSelected, sentiment }) => (
                  <label
                    key={category}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onCategoryToggle(category)}
                      className="w-4 h-4 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate group-hover:text-blue-200 transition-colors">
                        {category}
                      </div>
                      <div className="text-white/60 text-sm">
                        {count} item{count !== 1 ? "s" : ""}
                      </div>
                      <div className="flex gap-1 mt-1">
                        <span className="text-xs text-green-400">+{sentiment.positive}</span>
                        <span className="text-xs text-yellow-400">~{sentiment.neutral}</span>
                        <span className="text-xs text-red-400">-{sentiment.negative}</span>
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="text-white/60 text-center py-4">No categories found for "{searchTerm}"</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={onToggleOpen} />}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  )
}

export default EnhancedFilterPanel
