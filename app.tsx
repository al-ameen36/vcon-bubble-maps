"use client";

import type React from "react";
import { useState, useMemo, useEffect } from "react";
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

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set()
  );
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [contentSearchTerm, setContentSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedSentiments, setSelectedSentiments] = useState<string[]>([]);
  const [selectedBubble, setSelectedBubble] = useState<string | null>(null);

  useEffect(() => {
    if (results.length > 0 && selectedCategories.size === 0) {
      // if (selectedCategories.size === 0) return;
      const allCategories = new Set(
        results.map((item) => item.analysis?.[1].body.category)
      );
      setSelectedCategories(allCategories);
    }
  }, [results, selectedCategories]);

  // Apply all filters EXCEPT category filter for display purposes
  const filteredItemsForDisplay = useMemo(() => {
    let filtered = results;

    // Content search filter
    if (contentSearchTerm.trim()) {
      const searchLower = contentSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.analysis?.[1].body.keywords?.some((keyword: string) =>
            keyword.toLowerCase().includes(searchLower)
          ) ||
          item.analysis?.[0].body?.some((chat: { message: string }) =>
            chat.message.toLowerCase().includes(searchLower)
          )
      );
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter((item) => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
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
        (item) =>
          item.analysis?.[1].body.sentiment &&
          selectedSentiments.includes(item.analysis?.[1].body.sentiment.type)
      );
    }

    return filtered;
  }, [contentSearchTerm, dateRange, selectedSentiments, results]);

  // Apply category filter only for bubble visualization
  const filteredItemsForBubbles = useMemo(() => {
    if (selectedCategories.size === 0) return []; // show nothing if none selected
    return filteredItemsForDisplay.filter((item) =>
      selectedCategories.has(item.analysis?.[1].body.category)
    );
  }, [filteredItemsForDisplay, selectedCategories]);

  // Get category data with sentiment breakdown - always show all categories
  const categoryData = useMemo(() => {
    const categoryCounts = filteredItemsForDisplay.reduce(
      (acc, item) => {
        if (!acc[item.analysis?.[1].body.category]) {
          acc[item.analysis?.[1].body.category] = {
            count: 0,
            sentiment: { positive: 0, neutral: 0, negative: 0 },
          };
        }
        type sentimentKey = keyof {
          positive: number;
          neutral: number;
          negative: number;
        };
        acc[item.analysis?.[1].body.category].count++;
        if (item.analysis?.[1].body.sentiment) {
          acc[item.analysis?.[1].body.category].sentiment[
            item.analysis?.[1].body.sentiment as sentimentKey
          ]++;
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
      ...new Set(results.map((item) => item.analysis?.[1].body.category)),
    ];

    return allCategories.map((category) => {
      const data = categoryCounts[category] || {
        count: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
      };
      return {
        category,
        count: data.count,
        isSelected: selectedCategories.has(category),
        sentiment: data.sentiment,
      };
    });
  }, [results, filteredItemsForDisplay, selectedCategories]);

  // Get detailed data for selected bubble
  const bubbleDetailData = useMemo(() => {
    if (!selectedBubble) return null;

    const categoryItems = filteredItemsForDisplay.filter(
      (item) => item.analysis?.[1].body.category === selectedBubble
    );
    const totalDuration = categoryItems.reduce(
      (sum, item) => sum + (item.analysis?.[1].body.interaction_duration || 0),
      0
    );
    const totalParticipants = categoryItems.reduce(
      (sum, item) =>
        sum + (item.analysis?.[1].body.number_of_participants || 0),
      0
    );

    const sentimentBreakdown = categoryItems.reduce(
      (acc, item) => {
        type sentimentKey = keyof {
          positive: number;
          neutral: number;
          negative: number;
        };
        if (item.analysis?.[1].body.sentiment) {
          acc[item.analysis?.[1].body.sentiment.type as sentimentKey]++;
        }
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    // Get top keywords
    const keywordCounts = categoryItems.reduce((acc, item) => {
      item.analysis?.[1].body.keywords?.forEach((keyword: string) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Get recent items (sorted by date)
    const recentItems = categoryItems
      .filter((item) => item.created_at)
      .sort(
        (a, b) =>
          new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
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
  }, [selectedBubble, filteredItemsForDisplay, results]);

  const handleCategoryToggle = (category: string) => {
    const newSelected = new Set(selectedCategories);

    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }

    setSelectedCategories(new Set(newSelected));
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
