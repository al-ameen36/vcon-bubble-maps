"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface ItemData {
  name: string;
  category: string;
  [key: string]: any;
}

interface CircleData {
  r: number;
  color: string;
  category: string;
  count: number;
  x?: number;
  y?: number;
}

interface SimulationNode extends CircleData, d3.SimulationNodeDatum {
  index?: number;
  isDragging?: boolean;
}

const D3Circles: React.FC<{ items: ItemData[] }> = ({ items }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, undefined> | null>(
    null
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3
      .select<SVGSVGElement, unknown>(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Count the number of items in each category
    const categoryCounts = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Color scale for different categories
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Prepare data for circles
    const newData: SimulationNode[] = Object.keys(categoryCounts).map(
      (category) => {
        const count = categoryCounts[category];
        return {
          r: Math.max(30, count * 8),
          color: colorScale(category),
          category,
          count,
          isDragging: false,
        };
      }
    );

    // Get existing circles for smooth transitions
    const existingCircles = svg.selectAll<SVGCircleElement, SimulationNode>(
      "circle.bubble"
    );
    const existingLabels = svg.selectAll<SVGTextElement, SimulationNode>(
      "text.bubble-label"
    );
    const existingCountLabels = svg.selectAll<SVGTextElement, SimulationNode>(
      "text.bubble-count"
    );

    // Update gradients
    const defs = svg.select("defs").empty()
      ? svg.append("defs")
      : svg.select("defs");

    // Remove old gradients
    defs.selectAll("radialGradient").remove();

    newData.forEach((d, i) => {
      const gradient = defs
        .append("radialGradient")
        .attr("id", `gradient-${d.category.replace(/\s+/g, "-")}`)
        .attr("cx", "30%")
        .attr("cy", "30%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color("333")?.brighter(1).toString() || "#333");

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color("#333")?.darker(0.5).toString() || "#333");
    });

    // Create or update simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3
      .forceSimulation<SimulationNode>(newData)
      .velocityDecay(0.85)
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force("charge", d3.forceManyBody().strength(-100))
      .force(
        "collide",
        d3
          .forceCollide<SimulationNode>()
          .radius((d) => d.r + 8)
          .strength(0.9)
          .iterations(3)
      )
      .force("gravity", d3.forceCenter(width / 2, height / 2).strength(0.02));

    simulationRef.current = simulation;

    // Custom center pull force
    simulation.force("centerPull", () => {
      newData.forEach((d) => {
        if (!d.isDragging && d.x !== undefined && d.y !== undefined) {
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = centerX - d.x;
          const dy = centerY - d.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const pullStrength = 0.003 * distance;
          d.vx = (d.vx || 0) + dx * pullStrength;
          d.vy = (d.vy || 0) + dy * pullStrength;
        }
      });
    });

    // Update circles with smooth transitions
    const circles = svg
      .selectAll<SVGCircleElement, SimulationNode>("circle.bubble")
      .data(newData, (d) => d.category);

    // Remove exiting circles with animation
    circles
      .exit()
      .transition()
      .duration(500)
      .attr("r", 0)
      .style("opacity", 0)
      .remove();

    // Add new circles
    const circlesEnter = circles
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("r", 0)
      .attr("fill", (d) => `url(#gradient-${d.category.replace(/\s+/g, "-")})`)
      .attr("stroke", "rgba(255,255,255,0.3)")
      .attr("stroke-width", 2)
      .style("cursor", "grab")
      .style("opacity", 0);

    // Merge and update all circles
    const circlesMerged = circlesEnter.merge(circles);

    circlesMerged
      .transition()
      .duration(500)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => `url(#gradient-${d.category.replace(/\s+/g, "-")})`)
      .style("opacity", 1);

    // Add drag behavior
    circlesMerged.call(
      d3
        .drag<SVGCircleElement, SimulationNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.isDragging = true;
          d.fx = event.x;
          d.fy = event.y;
          d3.select(event.sourceEvent.target).style("cursor", "grabbing");
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
          d3.select(event.sourceEvent.target).style("cursor", "grab");
        })
    );

    // Add hover effects
    circlesMerged
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "white")
          .attr("stroke-width", 3)
          .attr("r", d.r * 1.1);
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "rgba(255,255,255,0.3)")
          .attr("stroke-width", 2)
          .attr("r", d.r);
      });

    // Update category labels
    const labels = svg
      .selectAll<SVGTextElement, SimulationNode>("text.bubble-label")
      .data(newData, (d) => d.category);

    labels.exit().transition().duration(500).style("opacity", 0).remove();

    const labelsEnter = labels
      .enter()
      .append("text")
      .attr("class", "bubble-label")
      .text((d) => d.category)
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("stroke", "rgba(0,0,0,0.5)")
      .attr("stroke-width", 0.5)
      .style("pointer-events", "none")
      .style("opacity", 0);

    labelsEnter.merge(labels).transition().duration(500).style("opacity", 1);

    // Update count labels
    const countLabels = svg
      .selectAll<SVGTextElement, SimulationNode>("text.bubble-count")
      .data(newData, (d) => d.category);

    countLabels.exit().transition().duration(500).style("opacity", 0).remove();

    const countLabelsEnter = countLabels
      .enter()
      .append("text")
      .attr("class", "bubble-count")
      .text((d) => `${d.count} items`)
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .attr("font-family", "Arial, sans-serif")
      .attr("font-size", "10px")
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("stroke", "rgba(0,0,0,0.3)")
      .attr("stroke-width", 0.3)
      .style("pointer-events", "none")
      .style("opacity", 0);

    countLabelsEnter
      .merge(countLabels)
      .transition()
      .duration(500)
      .style("opacity", 1);

    // Update positions on each tick
    simulation.on("tick", () => {
      circlesMerged.attr("cx", (d) => d.x || 0).attr("cy", (d) => d.y || 0);

      svg
        .selectAll<SVGTextElement, SimulationNode>("text.bubble-label")
        .attr("x", (d) => d.x || 0)
        .attr("y", (d) => d.y || 0);

      svg
        .selectAll<SVGTextElement, SimulationNode>("text.bubble-count")
        .attr("x", (d) => d.x || 0)
        .attr("y", (d) => d.y || 0);
    });

    // Handle window resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      svg.attr("width", newWidth).attr("height", newHeight);

      simulation
        .force(
          "center",
          d3.forceCenter(newWidth / 2, newHeight / 2).strength(0.05)
        )
        .force(
          "gravity",
          d3.forceCenter(newWidth / 2, newHeight / 2).strength(0.02)
        )
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
  }, [items]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </div>
  );
};

export default D3Circles;
