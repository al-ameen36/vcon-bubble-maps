"use client";

import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import type { Doc } from "../convex/_generated/dataModel";

interface SimulationNode extends Doc<"vcons">, d3.SimulationNodeDatum {
  index?: number;
  isDragging?: boolean;
}

interface FigmaCanvasProps {
  items: Doc<"vcons">[];
  onBubbleClick: (category: string) => void;
}

const FigmaCanvas: React.FC<FigmaCanvasProps> = ({ items, onBubbleClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(
    null
  );
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const handleZoom = useCallback((event: any) => {
    const { x, y, k } = event.transform;
    setTransform({ x, y, k });
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);

    // Set up zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on("zoom", handleZoom);

    svg.call(zoom);

    // Count the number of items in each category and calculate sentiment
    const categoryData = items.reduce((acc, item) => {
      if (item.analysis?.[1]) {
        if (!acc[item.analysis?.[1].body.category]) {
          acc[item.analysis?.[1].body.category] = {
            count: 0,
            sentiment: { positive: 0, neutral: 0, negative: 0 },
          };
        }
        acc[item.analysis?.[1].body.category].count++;
        if (item.analysis?.[1].body.sentiment) {
          acc[item.analysis?.[1].body.category].sentiment[
            item.analysis?.[1].body.sentiment.type as keyof {
              positive: number;
              neutral: number;
              negative: number;
            }
          ]++;
        }
      }
      return acc;
    }, {} as Record<string, { count: number; sentiment: { positive: number; neutral: number; negative: number } }>);

    // Prepare data for circles
    const newData: SimulationNode[] = Object.keys(categoryData).map(
      (category) => {
        const { count, sentiment } = categoryData[category];
        return {
          r: count * 12 + 40,
          category,
          count,
          sentiment,
          isDragging: false,
        };
      }
    );

    // Create main group for all elements
    const mainGroup = svg.select("g.main-group").empty()
      ? svg.append("g").attr("class", "main-group")
      : svg.select("g.main-group");

    // Clear previous content
    mainGroup.selectAll("*").remove();

    // Create defs for gradients
    const defs = svg.select("defs").empty()
      ? svg.append("defs")
      : svg.select("defs");
    defs.selectAll("*").remove();

    // Create gradients for bubbles
    newData.forEach((d, i) => {
      const gradient = defs
        .append("radialGradient")
        .attr(
          "id",
          `gradient-${d.analysis?.[1].body.category.replace(/\s+/g, "-")}`
        )
        .attr("cx", "30%")
        .attr("cy", "30%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr(
          "stop-color",
          d3.color(d.color)?.brighter(1).toString() || d.color
        );

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr(
          "stop-color",
          d3.color(d.color)?.darker(0.5).toString() || d.color
        );
    });

    // Use viewport center for simulation
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    // Create or update simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3
      .forceSimulation<SimulationNode>(newData)
      .velocityDecay(0.85)
      .force("center", d3.forceCenter(centerX, centerY).strength(0.1))
      .force("charge", d3.forceManyBody().strength(-200))
      .force(
        "collide",
        d3
          .forceCollide<SimulationNode>()
          .radius((d) => d.r + 20)
          .strength(0.9)
          .iterations(3)
      );

    // Custom center pull force
    simulation.force("centerPull", () => {
      newData.forEach((d) => {
        if (!d.isDragging && d.x !== undefined && d.y !== undefined) {
          const dx = centerX - d.x;
          const dy = centerY - d.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const pullStrength = 0.003 * distance;
          d.vx = (d.vx || 0) + dx * pullStrength;
          d.vy = (d.vy || 0) + dy * pullStrength;
        }
      });
    });

    simulationRef.current = simulation;

    // Add circles
    const circles = mainGroup
      .selectAll<SVGCircleElement, SimulationNode>("circle.bubble")
      .data(newData, (d) => d.category)
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => `rgba(0,0,0,0.4)`)
      .attr("stroke-width", 6)
      .style("cursor", "pointer")
      .attr("stroke", "#f59e0b");

    // Add click handler
    circles.on("click", (_event, d) => {
      console.log(_event, d);

      onBubbleClick(d.category);
    });

    // Add drag behavior
    circles.call(
      d3
        .drag<SVGCircleElement, SimulationNode>()
        .on("start", (_event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.isDragging = true;
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.isDragging = false;
          d.fx = null;
          d.fy = null;
        })
    );

    // Add hover effects
    circles
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 8)
          .attr("r", d.r * 1.1);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-width", 6)
          .attr("r", d.r);
      });

    // Add category labels
    const labels = mainGroup
      .selectAll<SVGTextElement, SimulationNode>("text.bubble-label")
      .data(newData, (d) => d.category)
      .enter()
      .append("text")
      .attr("class", "bubble-label")
      .text((d) => d.category)
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("stroke", "rgba(0,0,0,0.5)")
      .attr("stroke-width", 0.5)
      .style("pointer-events", "none");

    // Add count labels
    const countLabels = mainGroup
      .selectAll<SVGTextElement, SimulationNode>("text.bubble-count")
      .data(newData, (d) => d.category)
      .enter()
      .append("text")
      .attr("class", "bubble-count")
      .text((d) => `${d.count} items`)
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", "12px")
      .attr("fill", "rgba(255,255,255,0.9)")
      .attr("stroke", "rgba(0,0,0,0.3)")
      .attr("stroke-width", 0.3)
      .style("pointer-events", "none");

    // Update positions on each tick
    simulation.on("tick", () => {
      circles.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);

      labels.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);

      countLabels.attr("x", (d) => d.x || 0).attr("y", (d) => d.y || 0);
    });

    // Handle window resize
    const handleResize = () => {
      const newRect = container.getBoundingClientRect();
      const newCenterX = newRect.width / 2;
      const newCenterY = newRect.height / 2;

      simulation
        .force("center", d3.forceCenter(newCenterX, newCenterY).strength(0.1))
        .alpha(0.3)
        .restart();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [items, onBubbleClick, handleZoom]);

  // Apply transform to main group
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const mainGroup = svg.select("g.main-group");
    mainGroup.attr(
      "transform",
      `translate(${transform.x},${transform.y}) scale(${transform.k})`
    );
  }, [transform]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{
          cursor: "grab",
        }}
        onMouseDown={(e) => {
          if (e.currentTarget) {
            e.currentTarget.style.cursor = "grabbing";
          }
        }}
        onMouseUp={(e) => {
          if (e.currentTarget) {
            e.currentTarget.style.cursor = "grab";
          }
        }}
      />

      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs text-gray-600 space-y-1">
          <div>Zoom: {Math.round(transform.k * 100)}%</div>
          <div className="text-xs text-gray-500">
            • Mouse wheel to zoom • Drag to pan • Drag bubbles to move
          </div>
        </div>
      </div>
    </div>
  );
};

export default FigmaCanvas;
