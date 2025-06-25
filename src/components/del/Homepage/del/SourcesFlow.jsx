// src/components/Homepage/SourcesFlow.jsx - Fresh implementation
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import styles from './SourcesFlow.module.css';
import graphData from '../../data/knowledgeGraph.json';

export default function SourcesFlow() {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const [highlightedBranch, setHighlightedBranch] = useState(null);
  const [statsDisplay, setStatsDisplay] = useState(null);
  
  // Enhanced responsive dimensions calculation
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const viewportWidth = window.innerWidth;
    
    // Calculate size based on viewport and container - MUCH more aggressive on mobile
    let size;
    
    if (viewportWidth <= 480) {
      // Small mobile: Use almost ALL available width
      size = Math.min(containerWidth - 5, viewportWidth - 10, 500);
    } else if (viewportWidth <= 768) {
      // Mobile/tablet: Use most of the width
      size = Math.min(containerWidth - 15, viewportWidth - 30, 700);
    } else if (viewportWidth <= 1024) {
      // Small desktop/large tablet: Medium size
      size = Math.min(containerWidth - 60, viewportWidth - 100, 800);
    } else if (viewportWidth <= 1440) {
      // Standard desktop: Large size
      size = Math.min(containerWidth - 80, viewportWidth - 120, 1000);
    } else {
      // Large desktop: Maximum size
      size = Math.min(containerWidth - 100, viewportWidth - 200, 1200);
    }
    
    // Ensure minimum size for usability
    size = Math.max(size, 320);
    
    setDimensions({ width: size, height: size });
  }, []);

  // Responsive resize handler with debouncing
  useEffect(() => {
    updateDimensions();
    
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 150);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  // Main D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const { width, height } = dimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    
    svg.attr("width", width).attr("height", height);
    
    // Enhanced responsive scaling based on actual size
    const sizeScale = width / 800; // Base size of 800px
    const isSmall = width < 500;
    const isMedium = width >= 500 && width < 800;
    
    // Dynamic layer radii - MUCH more aggressive space usage
    const baseRadius = width * 0.18; // Increased from 0.12 to use more space
    const layerRadius = {
      0: 0,                        // Center (Atlas)
      1: baseRadius,               // Hub ring  
      2: baseRadius * (isSmall ? 1.4 : isMedium ? 1.5 : 1.6), // Source ring - tighter spacing
      3: baseRadius * (isSmall ? 1.7 : isMedium ? 1.85 : 2.0)  // "More" ring - tighter spacing
    };
    
    // Position nodes in concentric circles
    graphData.nodes.forEach(node => {
      const radius = layerRadius[node.layer];
      const angleRad = (node.angle * Math.PI) / 180;
      node.x = centerX + radius * Math.cos(angleRad);
      node.y = centerY + radius * Math.sin(angleRad);
    });
    
    // Add concentric circle guides
    svg.append("g")
      .selectAll("circle")
      .data([layerRadius[1], layerRadius[2], layerRadius[3]])
      .enter().append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", d => d)
      .attr("fill", "none")
      .attr("stroke", "#c0c0c0")
      .attr("stroke-width", sizeScale < 0.7 ? 1 : 1.5)
      .attr("stroke-dasharray", isSmall ? "2,2" : "3,3")
      .attr("opacity", 0.5);
    
    // Create links with responsive stroke widths
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("id", d => `${d.source}-${d.target}`)
      .attr("stroke", "#1971c2")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", d => {
        const baseWidth = d.target === 'atlas' ? 4 : 2;
        return baseWidth * Math.max(sizeScale, 0.5);
      })
      .attr("x1", d => graphData.nodes.find(n => n.id === d.source).x)
      .attr("y1", d => graphData.nodes.find(n => n.id === d.source).y)
      .attr("x2", d => graphData.nodes.find(n => n.id === d.target).x)
      .attr("y2", d => graphData.nodes.find(n => n.id === d.target).y);
    
    // Create node groups
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter().append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);
    
    // Helper functions
    const getBranchNodes = (nodeId) => {
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node.type === 'hub') {
        const sources = graphData.nodes.filter(n => (n.type === 'source' || n.type === 'more') && n.hubAngle === node.angle).map(n => n.id);
        return [nodeId, ...sources];
      } else if (node.type === 'source' || node.type === 'more') {
        const hub = graphData.nodes.find(n => n.type === 'hub' && n.angle === node.hubAngle);
        return [nodeId, hub.id];
      }
      return [nodeId];
    };
    
    const getPathToAtlas = (nodeId) => {
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node.type === 'central') return [];
      if (node.type === 'hub') return [`${nodeId}-atlas`];
      if (node.type === 'source' || node.type === 'more') {
        const hub = graphData.nodes.find(n => n.type === 'hub' && n.angle === node.hubAngle);
        return [`${nodeId}-${hub.id}`, `${hub.id}-atlas`];
      }
      return [];
    };
    
    // Calculate node radius function - bigger nodes
    const getNodeRadius = (d) => {
      let baseSize;
      if (d.type === 'central') baseSize = 45; // Increased from 35
      else if (d.type === 'hub') baseSize = 30; // Increased from 24
      else if (d.type === 'more') baseSize = 16; // Increased from 12
      else baseSize = 20; // Increased from 16
      
      const scaledSize = baseSize * Math.max(sizeScale, 0.7); // Increased minimum scale
      
      if (d.type === 'central') return Math.max(scaledSize, 30); // Increased minimum
      if (d.type === 'hub') return Math.max(scaledSize, 22); // Increased minimum
      if (d.type === 'more') return Math.max(scaledSize, 10); // Increased minimum
      return Math.max(scaledSize, 15); // Increased minimum
    };
    
    // Add circles
    nodeGroup.append("circle")
      .attr("r", getNodeRadius)
      .attr("fill", d => {
        if (d.type === 'central') return "#1971c2";
        if (d.type === 'hub') return "#339af0";
        if (d.type === 'more') return "#94a3b8";
        return "#74c0fc";
      })
      .attr("stroke", d => d.type === 'more' ? "#94a3b8" : "#ffffff")
      .attr("stroke-width", Math.max(sizeScale * 2, 1))
      .attr("stroke-dasharray", d => d.type === 'more' ? "3,2" : "none")
      .style("filter", `drop-shadow(0px ${2 * sizeScale}px ${4 * sizeScale}px rgba(0,0,0,0.1))`)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        const branchNodes = getBranchNodes(d.id);
        const pathToAtlas = getPathToAtlas(d.id);
        setHighlightedBranch(branchNodes);
        
        const statsInfo = d.type === 'more' ? 
          { node: d, x: event.pageX, y: event.pageY, showExamples: true } :
          { node: d, x: event.pageX, y: event.pageY };
        setStatsDisplay(statsInfo);
        
        // Hover effects
        nodeGroup.selectAll("circle")
          .transition()
          .duration(200)
          .style("opacity", node => branchNodes.includes(node.id) ? 1 : 0.2)
          .attr("transform", node => branchNodes.includes(node.id) ? "scale(1.1)" : "scale(1)");
        
        link.transition()
          .duration(200)
          .style("opacity", function() {
            const linkId = d3.select(this).attr("id");
            return pathToAtlas.includes(linkId) ? 1 : 0.1;
          })
          .attr("stroke-width", function() {
            const linkId = d3.select(this).attr("id");
            if (pathToAtlas.includes(linkId)) {
              const currentWidth = parseFloat(d3.select(this).attr("stroke-width"));
              return currentWidth * 1.5;
            }
            return d3.select(this).attr("stroke-width");
          });
      })
      .on("mouseleave", function() {
        setHighlightedBranch(null);
        setStatsDisplay(null);
        
        nodeGroup.selectAll("circle")
          .transition()
          .duration(200)
          .style("opacity", 1)
          .attr("transform", "scale(1)");
        
        link.transition()
          .duration(200)
          .style("opacity", 0.4)
          .attr("stroke-width", d => {
            const baseWidth = d.target === 'atlas' ? 4 : 2;
            return baseWidth * Math.max(sizeScale, 0.5);
          });
      });

    // Add icons with proper centering
    nodeGroup.append("foreignObject")
      .attr("width", d => {
        const radius = getNodeRadius(d);
        return radius * 1.2; // Icon is 60% of circle diameter
      })
      .attr("height", d => {
        const radius = getNodeRadius(d);
        return radius * 1.2;
      })
      .attr("x", d => {
        const radius = getNodeRadius(d);
        const iconSize = radius * 1.2;
        return -iconSize / 2; // Center horizontally
      })
      .attr("y", d => {
        const radius = getNodeRadius(d);
        const iconSize = radius * 1.2;
        return -iconSize / 2; // Center vertically
      })
      .style("pointer-events", "none")
      .style("opacity", d => d.type === 'more' ? 0.6 : 1)
      .append("xhtml:img")
      .attr("src", d => `/img/graph_visualization/${d.icon}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("filter", d => d.type === 'more' ? "brightness(0) invert(0.7)" : "brightness(0) invert(1)")
      .style("object-fit", "contain")
      .style("object-position", "center center");
    
  }, [dimensions]);

  return (
    <div ref={containerRef} className={styles.graphContainer}>
      <svg ref={svgRef} className={styles.networkGraph}></svg>
      
      {/* Stats Overlay */}
      {statsDisplay && (
        <div 
          className={styles.statsOverlay}
          style={{
            left: Math.min(statsDisplay.x - 150, window.innerWidth - 320),
            top: Math.max(statsDisplay.y - 100, 20)
          }}
        >
          <div className={styles.statsCard}>
            <h4 className={styles.statsTitle}>{statsDisplay.node.label}</h4>
            <div className={styles.statsContent}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{statsDisplay.node.stats.count || statsDisplay.node.stats.total}</span>
              </div>
              {statsDisplay.showExamples && statsDisplay.node.stats.examples && (
                <div className={styles.examplesSection}>
                  <div className={styles.examplesTitle}>Examples include:</div>
                  <div className={styles.examplesList}>
                    {statsDisplay.node.stats.examples.slice(0, 3).map((example, index) => (
                      <div key={index} className={styles.exampleItem}>{example}</div>
                    ))}
                    {statsDisplay.node.stats.examples.length > 3 && (
                      <div className={styles.exampleItem}>...and more</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
