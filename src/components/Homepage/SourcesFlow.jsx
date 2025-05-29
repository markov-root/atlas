// src/components/Homepage/SourcesFlow.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './SourcesFlow.module.css';

// Define the concentric circle data structure
const graphData = {
  nodes: [
    // Central Atlas node (innermost)
    { id: 'atlas', label: 'AI Safety Atlas', type: 'central', layer: 0, angle: 0 },
    
    // Category hub nodes (middle ring)
    { id: 'papers-hub', label: 'Papers', type: 'hub', layer: 1, angle: 0 },
    { id: 'podcasts-hub', label: 'Podcasts', type: 'hub', layer: 1, angle: 72 },
    { id: 'blog-hub', label: 'Blog Posts', type: 'hub', layer: 1, angle: 144 },
    { id: 'courses-hub', label: 'Courses', type: 'hub', layer: 1, angle: 216 },
    { id: 'youtube-hub', label: 'YouTube', type: 'hub', layer: 1, angle: 288 },
    
    // Source nodes (outer ring) - positioned around their respective hubs
    { id: 'arxiv', label: 'ArXiv', type: 'source', layer: 2, angle: -15, hubAngle: 0 },
    { id: 'doi', label: 'DOI', type: 'source', layer: 2, angle: 15, hubAngle: 0 },
    
    { id: 'axrp', label: 'AXRP', type: 'source', layer: 2, angle: 57, hubAngle: 72 },
    { id: 'mlst', label: 'MLST', type: 'source', layer: 2, angle: 72, hubAngle: 72 },
    { id: 'inside-view', label: 'Inside View', type: 'source', layer: 2, angle: 87, hubAngle: 72 },
    
    { id: 'alignment-forum', label: 'Alignment Forum', type: 'source', layer: 2, angle: 129, hubAngle: 144 },
    { id: 'lesswrong', label: 'LessWrong', type: 'source', layer: 2, angle: 144, hubAngle: 144 },
    { id: 'substack', label: 'Substack', type: 'source', layer: 2, angle: 159, hubAngle: 144 },
    
    { id: 'bluedot', label: 'BlueDot AISF', type: 'source', layer: 2, angle: 201, hubAngle: 216 },
    { id: 'cais', label: 'CAIS IMLS', type: 'source', layer: 2, angle: 216, hubAngle: 216 },
    { id: 'stanford', label: 'Stanford Online', type: 'source', layer: 2, angle: 231, hubAngle: 216 },
    
    { id: 'rational-anim', label: 'Rational Animations', type: 'source', layer: 2, angle: 273, hubAngle: 288 },
    { id: 'rob-miles', label: 'Rob Miles', type: 'source', layer: 2, angle: 303, hubAngle: 288 },
  ],
  links: [
    // Hub to central connections (spokes)
    { source: 'papers-hub', target: 'atlas' },
    { source: 'podcasts-hub', target: 'atlas' },
    { source: 'blog-hub', target: 'atlas' },
    { source: 'courses-hub', target: 'atlas' },
    { source: 'youtube-hub', target: 'atlas' },
    
    // Source to hub connections
    { source: 'arxiv', target: 'papers-hub' },
    { source: 'doi', target: 'papers-hub' },
    
    { source: 'axrp', target: 'podcasts-hub' },
    { source: 'mlst', target: 'podcasts-hub' },
    { source: 'inside-view', target: 'podcasts-hub' },
    
    { source: 'alignment-forum', target: 'blog-hub' },
    { source: 'lesswrong', target: 'blog-hub' },
    { source: 'substack', target: 'blog-hub' },
    
    { source: 'bluedot', target: 'courses-hub' },
    { source: 'cais', target: 'courses-hub' },
    { source: 'stanford', target: 'courses-hub' },
    
    { source: 'rational-anim', target: 'youtube-hub' },
    { source: 'rob-miles', target: 'youtube-hub' },
  ]
};

export default function SourcesFlow() {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const width = 700;
    const height = 700;
    const centerX = width / 2;
    const centerY = height / 2;
    
    svg.attr("width", width).attr("height", height);
    
    // Define layer radii for the concentric circles
    const layerRadius = {
      0: 0,      // Center
      1: 120,    // Hub ring
      2: 220     // Source ring (outer edge)
    };
    
    // Position nodes in concentric circles
    graphData.nodes.forEach(node => {
      const radius = layerRadius[node.layer];
      const angleRad = (node.angle * Math.PI) / 180;
      
      node.x = centerX + radius * Math.cos(angleRad);
      node.y = centerY + radius * Math.sin(angleRad);
      node.fx = node.x; // Fix positions
      node.fy = node.y;
    });
    
    // Add concentric circle guides (subtle)
    svg.append("g")
      .selectAll("circle")
      .data([layerRadius[1], layerRadius[2]])
      .enter().append("circle")
      .attr("cx", centerX)
      .attr("cy", centerY)
      .attr("r", d => d)
      .attr("fill", "none")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,3")
      .attr("opacity", 0.3);
    
    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(graphData.links)
      .enter().append("line")
      .attr("stroke", "#1971c2")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", d => {
        // Thicker lines for hub-to-center connections
        return d.target === 'atlas' ? 3 : 1.5;
      })
      .attr("x1", d => d.source.x || graphData.nodes.find(n => n.id === d.source).x)
      .attr("y1", d => d.source.y || graphData.nodes.find(n => n.id === d.source).y)
      .attr("x2", d => d.target.x || graphData.nodes.find(n => n.id === d.target).x)
      .attr("y2", d => d.target.y || graphData.nodes.find(n => n.id === d.target).y);
    
    // Create node groups
    const nodeGroup = svg.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .enter().append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);
    
    // Add node circles with size based on hierarchy
    nodeGroup.append("circle")
      .attr("r", d => {
        if (d.type === 'central') return 30;
        if (d.type === 'hub') return 20;
        return 12;
      })
      .attr("fill", d => {
        if (d.type === 'central') return "#1971c2";
        if (d.type === 'hub') return "#339af0";
        return "#74c0fc";
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))");
    
    // Add icons
    nodeGroup.append("foreignObject")
      .attr("width", d => {
        if (d.type === 'central') return 36;
        if (d.type === 'hub') return 24;
        return 16;
      })
      .attr("height", d => {
        if (d.type === 'central') return 36;
        if (d.type === 'hub') return 24;
        return 16;
      })
      .attr("x", d => {
        if (d.type === 'central') return -18;
        if (d.type === 'hub') return -12;
        return -8;
      })
      .attr("y", d => {
        if (d.type === 'central') return -18;
        if (d.type === 'hub') return -12;
        return -8;
      })
      .append("xhtml:img")
      .attr("src", "/img/icons/arxiv.svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("filter", "brightness(0) invert(1)");
    
    // Add labels positioned outside the circles
    nodeGroup.append("text")
      .text(d => d.label)
      .attr("font-size", d => {
        if (d.type === 'central') return 14;
        if (d.type === 'hub') return 11;
        return 9;
      })
      .attr("text-anchor", "middle")
      .attr("dy", d => {
        if (d.type === 'central') return 50;
        if (d.type === 'hub') return 40;
        return 30;
      })
      .attr("fill", "#1971c2")
      .attr("font-weight", d => d.type === 'central' ? "700" : "500")
      .style("text-shadow", "0 1px 2px rgba(255,255,255,0.8)");
    
  }, []);

  return (
    <section className={styles.sourcesFlowSection}>
      <div className="container">
        <h2 className={styles.sectionTitle}>
          Knowledge Distillation Globe
        </h2>
        <p className={styles.sectionDescription}>
          From thousands of scattered sources to organized categories to one unified atlas—
          the progressive distillation of AI safety knowledge.
        </p>
        
        <div className={styles.graphContainer}>
          <svg ref={svgRef} className={styles.networkGraph}></svg>
        </div>
        
        <div className={styles.layerLabels}>
          <div className={styles.layerLabel}>
            <span className={styles.layerDot} style={{backgroundColor: '#74c0fc'}}></span>
            Individual Sources (Outer Ring)
          </div>
          <div className={styles.layerLabel}>
            <span className={styles.layerDot} style={{backgroundColor: '#339af0'}}></span>
            Categories (Middle Ring)
          </div>
          <div className={styles.layerLabel}>
            <span className={styles.layerDot} style={{backgroundColor: '#1971c2'}}></span>
            Atlas (Center)
          </div>
        </div>
      </div>
    </section>
  );
}
