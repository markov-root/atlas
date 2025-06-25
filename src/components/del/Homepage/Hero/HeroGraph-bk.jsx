// src/components/Homepage/Hero/HeroGraph.jsx
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './HeroGraph.module.css';

export default function HeroGraph() {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    let rafId;

    const updateVisualization = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Use requestAnimationFrame for smooth, immediate updates
      rafId = requestAnimationFrame(() => {
        // Clear any existing content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const container = svgRef.current.parentElement;
        
        if (!container) return;
        
        // Get fresh dimensions immediately
        const containerRect = container.getBoundingClientRect();
        
        // Use full container dimensions with proper padding
        const padding = window.innerWidth <= 768 ? 10 : 20;
        const width = Math.max(200, containerRect.width - padding);
        const height = Math.max(200, containerRect.height - padding);
        
        // Set up SVG dimensions
        svg.attr('width', width).attr('height', height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2.5;

        // Company nodes forming part of a circle around Atlas
        const companyNodes = [
          { label: 'Anthropic', icon: '/img/home/graph/l2_anthropic.svg', angle: Math.PI * 0.2 },
          { label: 'DeepMind', icon: '/img/home/graph/l2_deepmind.svg', angle: Math.PI * 0.4 },
          { label: 'OpenAI', icon: '/img/home/graph/l2_openai.svg', angle: Math.PI * 0.6 },
          { label: 'DeepSeek', icon: '/img/home/graph/l2_deepseek.svg', angle: Math.PI * 0.8 },
          { label: 'LessWrong', icon: '/img/home/graph/lesswrong.svg', angle: Math.PI * 1.0 },
          { label: 'ArXiv', icon: '/img/home/graph/arxiv.svg', angle: Math.PI * 1.2 },
          { label: 'FarAI', icon: '/img/home/graph/farai.svg', angle: Math.PI * 1.4 },
          { label: 'Epoch', icon: '/img/home/graph/epoch.svg', angle: Math.PI * 1.6 },
          { label: 'Substack', icon: '/img/home/graph/substack.svg', angle: Math.PI * 1.8 },
          { label: 'YouTube', icon: '/img/home/graph/youtube.svg', angle: Math.PI * 2.0 }
        ];

        const companyRingRadius = maxRadius * 0.6; // Distance from center
        
        // Node sizing - just center and company nodes
        const companyNodeRadius = Math.max(16, Math.min(width, height) / 25); // Company nodes
        const companyIconSize = companyNodeRadius * 1.5; // Icon size for companies

        // No more concentric circles - the arcs will form the circle

        // DRAW SPREADING EDGES WITH ARCS - from center to companies
        companyNodes.forEach(node => {
          const nodeX = centerX + Math.cos(node.angle) * companyRingRadius;
          const nodeY = centerY + Math.sin(node.angle) * companyRingRadius;

          // Create a curved/organic spreading edge from center toward the node
          const controlX = centerX + Math.cos(node.angle) * (companyRingRadius * 0.3);
          const controlY = centerY + Math.sin(node.angle) * (companyRingRadius * 0.3);

          // Calculate edge end point (slightly before the node)
          const edgeEndRadius = companyRingRadius * 0.85; // Stop edge before reaching node
          const edgeEndX = centerX + Math.cos(node.angle) * edgeEndRadius;
          const edgeEndY = centerY + Math.sin(node.angle) * edgeEndRadius;

          // Draw curved path from center to edge end
          const edgePath = `M ${centerX} ${centerY} Q ${controlX} ${controlY} ${edgeEndX} ${edgeEndY}`;
          
          svg.append('path')
            .attr('d', edgePath)
            .attr('stroke', 'var(--atlas-primary)')
            .attr('stroke-width', 2)
            .attr('opacity', 0.4)
            .attr('fill', 'none')
            .attr('class', 'spreading-edge');

          // Create small arc at the end of each edge
          const arcRadius = companyRingRadius * 0.9; // Arc radius (between edge end and node)
          const arcLength = 0.12; // Smaller arc spans - about 0.12 radians for 10 nodes
          
          // Calculate arc start and end angles
          const arcStartAngle = node.angle - arcLength / 2;
          const arcEndAngle = node.angle + arcLength / 2;
          
          // Calculate arc start and end points
          const arcStartX = centerX + Math.cos(arcStartAngle) * arcRadius;
          const arcStartY = centerY + Math.sin(arcStartAngle) * arcRadius;
          const arcEndX = centerX + Math.cos(arcEndAngle) * arcRadius;
          const arcEndY = centerY + Math.sin(arcEndAngle) * arcRadius;
          
          // Create arc path using SVG arc notation
          const arcPath = `M ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 0 1 ${arcEndX} ${arcEndY}`;
          
          svg.append('path')
            .attr('d', arcPath)
            .attr('stroke', 'var(--atlas-primary)')
            .attr('stroke-width', 3)
            .attr('opacity', 0.6)
            .attr('fill', 'none')
            .attr('class', 'circle-arc');
        });

        // Draw company nodes forming part of the circle
        companyNodes.forEach(node => {
          const x = centerX + Math.cos(node.angle) * companyRingRadius;
          const y = centerY + Math.sin(node.angle) * companyRingRadius;

          const nodeGroup = svg.append('g')
            .attr('transform', `translate(${x}, ${y})`)
            .attr('class', 'company-node');

          // Node circle background using theme colors
          nodeGroup.append('circle')
            .attr('r', companyNodeRadius)
            .attr('fill', 'var(--atlas-background)')
            .attr('stroke', 'var(--atlas-border-color)')
            .attr('stroke-width', 1.5)
            .attr('opacity', 1);

          // Add icon as foreignObject to embed SVG with theme-aware styling
          const foreignObject = nodeGroup.append('foreignObject')
            .attr('x', -companyIconSize/2)
            .attr('y', -companyIconSize/2)
            .attr('width', companyIconSize)
            .attr('height', companyIconSize);

          foreignObject.append('xhtml:div')
            .style('width', '100%')
            .style('height', '100%')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('justify-content', 'center')
            .html(`<img src="${node.icon}" alt="${node.label}" style="width: ${companyIconSize * 0.7}px; height: ${companyIconSize * 0.7}px; object-fit: contain;" class="theme-aware-icon" />`);
        });

        // Draw center Atlas node - biggest with logo
        const centerNodeRadius = Math.max(30, Math.min(width, height) / 12); // Increased from /15 to /12 to be biggest
        const centerIconSize = centerNodeRadius * 1.6; // Size for the logo icon
        
        const centerNode = svg.append('g')
          .attr('transform', `translate(${centerX}, ${centerY})`);

        // Center circle background using theme colors
        centerNode.append('circle')
          .attr('r', centerNodeRadius)
          .attr('fill', 'var(--atlas-background)')
          .attr('stroke', 'var(--atlas-border-color)')
          .attr('stroke-width', 2)
          .attr('opacity', 1);

        // Add Atlas logo instead of text
        const centerForeignObject = centerNode.append('foreignObject')
          .attr('x', -centerIconSize/2)
          .attr('y', -centerIconSize/2)
          .attr('width', centerIconSize)
          .attr('height', centerIconSize);

        centerForeignObject.append('xhtml:div')
          .style('width', '100%')
          .style('height', '100%')
          .style('display', 'flex')
          .style('align-items', 'center')
          .style('justify-content', 'center')
          .html(`<img src="/img/home/graph/l0_logo.svg" alt="Atlas" style="width: ${centerIconSize * 0.8}px; height: ${centerIconSize * 0.8}px; object-fit: contain;" class="theme-aware-icon" />`);
      });
    };

    // Immediate initial render
    updateVisualization();

    // ResizeObserver for container size changes (most reliable)
    let resizeObserver;
    if (window.ResizeObserver && svgRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        updateVisualization(); // Immediate update, no delay
      });
      resizeObserver.observe(svgRef.current.parentElement);
    }

    // Fallback: Window resize listener with minimal throttling
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updateVisualization, 16); // Just one frame delay
    };

    // Orientation change with slightly longer delay (mobile needs this)
    const handleOrientationChange = () => {
      setTimeout(updateVisualization, 100); // Minimal delay for orientation
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Cleanup
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };

  }, []);

  return (
    <div className={styles.graphArea}>
      <svg ref={svgRef} className={styles.svg}></svg>
    </div>
  );
}
