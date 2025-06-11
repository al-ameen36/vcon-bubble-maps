"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { sampleItems } from "./components/circle-data";
import FigmaCanvas from "./components/figma-canvas";
import EnhancedFilterPanel from "./components/enhanced-filter-panel";
import BubbleDetailModal from "./components/bubble-detail-modal";
import Chatbot from "./components/chatbot";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "./convex/_generated/api";

const App: React.FC = () => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.functions.vcons.getVconList,
    {},
    { initialNumItems: 5 }
  );

  useEffect(() => {
    console.log(results);
  }, [results]);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [contentSearchTerm, setContentSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);

  // Apply all filters EXCEPT category filter for display purposes
  const filteredItemsForDisplay = useMemo(() => {
    let filtered = sampleItems;

    // Content search filter
    if (contentSearchTerm.trim()) {
      const searchLower = contentSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchLower) ||
          item.content?.toLowerCase().includes(searchLower) ||
          item.keywords?.some((keyword) =>
            keyword.toLowerCase().includes(searchLower)
          )
      );
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((item) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        const startDate = dateRange.start
          ? new Date(dateRange.start)
          : new Date("1900-01-01");
        const endDate = dateRange.end
          ? new Date(dateRange.end)
          : new Date("2100-12-31");
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Sentiment filter
    if (selectedSentiments.length > 0) {
      filtered = filtered.filter(
        (item) => item.sentiment && selectedSentiments.includes(item.sentiment)
      );
    }

    return filtered;
  }, [contentSearchTerm, dateRange, selectedSentiments]);

  // Apply category filter only for bubble visualization
  const filteredItemsForBubbles = useMemo(() => {
    if (selectedCategories.size === 0) {
      return filteredItemsForDisplay; // Show all if none selected
    }
    return filteredItemsForDisplay.filter((item) =>
      selectedCategories.has(item.category)
    );
  }, [filteredItemsForDisplay, selectedCategories]);

  // Get category data with sentiment breakdown - always show all categories
  const categoryData = useMemo(() => {
    const categoryCounts = filteredItemsForDisplay.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = {
            count: 0,
            sentiment: { positive: 0, neutral: 0, negative: 0 },
          };
        }
        acc[item.category].count++;
        if (item.sentiment) {
          acc[item.category].sentiment[item.sentiment]++;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          count: number;
          sentiment: { positive: number; neutral: number; negative: number };
        }
      >
    );

    // Always include all categories that exist in the original data
    const allCategories = [
      ...new Set(sampleItems.map((item) => item.category)),
    ];

    return allCategories.map((category) => {
      const data = categoryCounts[category] || {
        count: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
      };
      return {
        category,
        count: data.count,
        isSelected:
          selectedCategories.size === 0 || selectedCategories.has(category),
        sentiment: data.sentiment,
      };
    });
  }, [filteredItemsForDisplay, selectedCategories]);

  // Get detailed data for selected bubble
  const bubbleDetailData = useMemo(() => {
    if (!selectedBubble) return null;

    const categoryItems = filteredItemsForDisplay.filter(
      (item) => item.category === selectedBubble
    );
    const totalDuration = categoryItems.reduce(
      (sum, item) => sum + (item.duration || 0),
      0
    );
    const totalParticipants = categoryItems.reduce(
      (sum, item) => sum + (item.participants || 0),
      0
    );

    const sentimentBreakdown = categoryItems.reduce(
      (acc, item) => {
        if (item.sentiment) {
          acc[item.sentiment]++;
        }
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    // Get top keywords
    const keywordCounts = categoryItems.reduce(
      (acc, item) => {
        item.keywords?.forEach((keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Get recent items (sorted by date)
    const recentItems = categoryItems
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 5);

    return {
      category: selectedBubble,
      items: categoryItems,
      totalDuration,
      avgDuration:
        categoryItems.length > 0
          ? Math.round(totalDuration / categoryItems.length)
          : 0,
      totalParticipants,
      avgParticipants:
        categoryItems.length > 0
          ? Math.round(totalParticipants / categoryItems.length)
          : 0,
      sentimentBreakdown,
      topKeywords,
      recentItems,
    };
  }, [selectedBubble, filteredItemsForDisplay]);

  const handleCategoryToggle = (category: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  const handleResetFilters = () => {
    setSelectedCategories(new Set());
    setContentSearchTerm("");
    setDateRange({ start: "", end: "" });
    setSelectedSentiments([]);
  };

  const handleSelectAll = () => {
    const allCategories = new Set(categoryData.map((item) => item.category));
    setSelectedCategories(allCategories);
  };

  const handleBubbleClick = (category: string) => {
    setSelectedBubble(category);
  };

  const handleContentSearch = (term: string) => {
    setContentSearchTerm(term);
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const handleSentimentFilter = (sentiments: string[]) => {
    setSelectedSentiments(sentiments);
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <FigmaCanvas
        items={filteredItemsForBubbles}
        onBubbleClick={handleBubbleClick}
      />
      <EnhancedFilterPanel
        categoryData={categoryData}
        isOpen={isFilterPanelOpen}
        onToggleOpen={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
        onCategoryToggle={handleCategoryToggle}
        onResetFilters={handleResetFilters}
        onSelectAll={handleSelectAll}
        selectedCount={selectedCategories.size}
        totalCount={categoryData.length}
        onContentSearch={handleContentSearch}
        onDateRangeChange={handleDateRangeChange}
        onSentimentFilter={handleSentimentFilter}
        contentSearchTerm={contentSearchTerm}
        dateRange={dateRange}
        selectedSentiments={selectedSentiments}
      />
      <BubbleDetailModal
        isOpen={!!selectedBubble}
        onClose={() => setSelectedBubble(null)}
        categoryData={bubbleDetailData}
      />
      <Chatbot
        filteredItems={filteredItemsForBubbles}
        selectedCategories={selectedCategories}
      />
    </div>
  );
};

export default App;
