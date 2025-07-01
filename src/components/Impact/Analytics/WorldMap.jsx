// src/components/Impact/Analytics/WorldMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import styles from './WorldMap.module.css';

export default function WorldMap({ countries }) {
  const svgRef = useRef();
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize with current theme state
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    return false;
  });

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const newIsDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(newIsDarkMode);
    };
    
    // Check immediately on mount
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    
    return () => observer.disconnect();
  }, []);

  // Create a lookup map for visitor data
  const countryDataMap = React.useMemo(() => {
    const map = new Map();
    countries.forEach(country => {
      const variations = getCountryNameVariations(country.name);
      variations.forEach(name => {
        map.set(name.toLowerCase(), country);
      });
    });
    return map;
  }, [countries]);

  // Helper function to get country name variations for better matching
  function getCountryNameVariations(countryName) {
    const variations = [countryName];
    
    const nameMap = {
      'United States': ['United States of America', 'USA', 'US'],
      'United Kingdom': ['UK', 'Britain', 'Great Britain'],
      'Russian Federation': ['Russia'],
      'South Korea': ['Korea, Republic of', 'Republic of Korea'],
      'North Korea': ['Korea, Democratic People\'s Republic of'],
      'Czech Republic': ['Czechia'],
      'Macedonia': ['North Macedonia'],
      'Congo': ['Democratic Republic of the Congo', 'Congo, The Democratic Republic of the'],
      'Tanzania': ['United Republic of Tanzania'],
      'Venezuela': ['Venezuela, Bolivarian Republic of'],
      'Iran': ['Iran, Islamic Republic of'],
      'Syria': ['Syrian Arab Republic'],
      'Moldova': ['Republic of Moldova'],
      'Bolivia': ['Bolivia, Plurinational State of'],
      'Laos': ['Lao People\'s Democratic Republic'],
      'Vietnam': ['Viet Nam'],
      'Czechia': ['Czech Republic']
    };
    
    if (nameMap[countryName]) {
      variations.push(...nameMap[countryName]);
    }
    
    return variations;
  }

  // Find country data by trying different name variations
  const findCountryData = (geoName) => {
    if (!geoName) return null;
    
    const exactMatch = countryDataMap.get(geoName.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }
    
    for (const [key, value] of countryDataMap.entries()) {
      if (key.includes(geoName.toLowerCase()) || geoName.toLowerCase().includes(key)) {
        return value;
      }
    }
    
    return null;
  };

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const container = svgRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const width = Math.max(300, containerRect.width);
    const height = width * 0.5;
    
    // Clear previous content
    svg.selectAll("*").remove();
    
    // Set up SVG
    svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("background", "transparent");

    // Create projection with adjusted scale and position
    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.8) // Slightly reduced from 5.5 to 5.8 for better fit
      .translate([width / 2, height / 1.9]); // Moved down from 2.2 to 1.9 to center better

    const path = d3.geoPath().projection(projection);

    // Load world topology data
    const loadWorldData = async () => {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const world = await response.json();
        const countries_geo = topojson.feature(world, world.objects.countries);
        
        // Find the correct name property
        const sampleCountry = countries_geo.features[0]?.properties;
        const possibleNameProps = ['NAME', 'NAME_EN', 'NAME_LONG', 'ADMIN', 'NAME_SORT', 'name', 'name_en'];
        let nameProperty = null;
        
        for (const prop of possibleNameProps) {
          if (sampleCountry && sampleCountry[prop]) {
            nameProperty = prop;
            break;
          }
        }
        
        if (!nameProperty) {
          console.error('Could not find valid name property in geographic data');
          return;
        }
        
        // Calculate max visitors for color scaling
        const maxVisitors = Math.max(...countries.map(c => c.visitors), 1);
        
        // Color scale - keep the blue gradient for data countries
        const colorScale = d3.scaleSequential()
          .domain([0, maxVisitors])
          .interpolator(d3.interpolateBlues);

        // Define colors based on current theme state (not just the state variable)
        const currentIsDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const noDataColor = currentIsDarkMode ? "#2d2d2d" : "#f5f5f5";
        const strokeColor = currentIsDarkMode ? "#404040" : "#ffffff";
        const hoverStrokeColor = currentIsDarkMode ? "#74c0fc" : "#1971c2";

        // Draw countries
        svg.selectAll(".country")
          .data(countries_geo.features)
          .enter()
          .append("path")
          .attr("class", "country")
          .attr("d", path)
          .attr("fill", d => {
            const geoName = d.properties[nameProperty];
            const countryData = findCountryData(geoName);
            
            if (countryData && countryData.visitors > 0) {
              return colorScale(countryData.visitors);
            }
            return noDataColor;
          })
          .attr("stroke", strokeColor)
          .attr("stroke-width", Math.max(0.5, width / 800))
          .style("cursor", d => {
            const geoName = d.properties[nameProperty];
            const countryData = findCountryData(geoName);
            return countryData ? "pointer" : "default";
          })
          .on("mouseover", function(event, d) {
            const geoName = d.properties[nameProperty];
            const countryData = findCountryData(geoName);
            
            if (countryData) {
              d3.select(this)
                .attr("stroke-width", Math.max(2, width / 400))
                .attr("stroke", hoverStrokeColor);
              
              setTooltip({
                show: true,
                x: event.clientX,
                y: event.clientY,
                data: countryData
              });
            }
          })
          .on("mousemove", function(event, d) {
            const geoName = d.properties[nameProperty];
            const countryData = findCountryData(geoName);
            
            if (countryData) {
              setTooltip(prev => ({
                ...prev,
                x: event.clientX,
                y: event.clientY
              }));
            }
          })
          .on("mouseout", function(event, d) {
            const geoName = d.properties[nameProperty];
            const countryData = findCountryData(geoName);
            
            if (countryData) {
              d3.select(this)
                .attr("stroke-width", Math.max(0.5, width / 800))
                .attr("stroke", strokeColor);
            }
            
            setTooltip({ show: false, x: 0, y: 0, data: null });
          });

      } catch (error) {
        console.error('Error loading world map data:', error);
        
        // Simple fallback message
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "#6c757d")
          .attr("font-size", Math.max(12, width / 40))
          .text("World map could not be loaded");
      }
    };

    loadWorldData();

    // Handle window resize
    const handleResize = () => {
      const newContainerRect = container.getBoundingClientRect();
      const newWidth = Math.max(300, newContainerRect.width);
      const newHeight = newWidth * 0.5;
      
      svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);
      
      const newProjection = d3.geoNaturalEarth1()
        .scale(newWidth / 5.8)
        .translate([newWidth / 2, newHeight / 1.9]);
      
      const newPath = d3.geoPath().projection(newProjection);
      
      svg.selectAll("path")
        .attr("d", newPath)
        .attr("stroke-width", Math.max(0.5, newWidth / 800));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [countries, countryDataMap, isDarkMode]);

  return (
    <div className={styles.worldMapContainer}>
      {/* Title */}
      <h3 className={styles.sectionTitle}>Global Reader Distribution</h3>
      
      {/* Map container with fixed aspect ratio */}
      <div className={styles.mapWrapper}>
        <svg ref={svgRef} className={styles.worldMapSvg}></svg>
      </div>
      
      {/* Simple explanation note */}
      <div className={styles.explanationNote}>
        <strong>About geographic data:</strong> We do not have strong data for readers before 06-2025. This means the numbers for several countries - Canada, Germany, France, UK, USA, Chile, Russia ... etc. are extremely underrepresented relative to where we know our actual readers to be. These are all places where we know courses have used are materials. Additionally, the visualization doesn't capture readers who access content through PDFs, offline materials, or read our materials directly on google docs (as the atlas was primarily on docs for the majority of its current life).
      </div>
      
      {/* Tooltip */}
      {tooltip.show && tooltip.data && (
        <div 
          className={styles.tooltip}
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          <div className={styles.tooltipContent}>
            <div className={styles.tooltipCountry}>{tooltip.data.name}</div>
            <div className={styles.tooltipStats}>
              {tooltip.data.visitors.toLocaleString()} readers
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
