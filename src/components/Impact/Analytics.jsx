// src/components/Impact/Analytics.jsx
import React from 'react';
import WorldMap from './Analytics/WorldMap';
import VisitorTimeline from './Analytics/VisitorTimeline';
import ChapterPerformance from './Analytics/ChapterPerformance';
import analyticsData from '../../data/analytics.json';
import feedbackData from '../../data/feedback.json'; // Add your feedback data file

// Import sidebar configurations for proper chapter/section names
import chapter01Sidebar from '../../../docs/chapters/01/sidebar.js';
import chapter02Sidebar from '../../../docs/chapters/02/sidebar.js';
import chapter03Sidebar from '../../../docs/chapters/03/sidebar.js';
import chapter04Sidebar from '../../../docs/chapters/04/sidebar.js';
import chapter05Sidebar from '../../../docs/chapters/05/sidebar.js';
import chapter06Sidebar from '../../../docs/chapters/06/sidebar.js';
import chapter07Sidebar from '../../../docs/chapters/07/sidebar.js';
import chapter08Sidebar from '../../../docs/chapters/08/sidebar.js';
import chapter09Sidebar from '../../../docs/chapters/09/sidebar.js';

import styles from './Analytics.module.css';

export default function Analytics() {
  const { meta, geography, timeline, overview, content } = analyticsData;
  
  // Create sidebar data mapping for proper chapter/section names
  const sidebarData = {
    chapter01: chapter01Sidebar,
    chapter02: chapter02Sidebar,
    chapter03: chapter03Sidebar,
    chapter04: chapter04Sidebar,
    chapter05: chapter05Sidebar,
    chapter06: chapter06Sidebar,
    chapter07: chapter07Sidebar,
    chapter08: chapter08Sidebar,
    chapter09: chapter09Sidebar,
  };
  
  return (
    <section className={styles.analyticsSection}>
      <div className={styles.analyticsHeader}>
        <h2 className={styles.analyticsTitle}>Quantitative Data</h2>
        <div className={styles.dateRange}>
          Data from {meta?.dateRange || 'Recent period'}
        </div>
      </div>
      
      {/* Visitor Timeline */}
      <VisitorTimeline timeline={timeline} overview={overview} />
      
      {/* World Map */}
      <WorldMap countries={geography?.countries || []} />
      
      {/* Chapter Performance with proper sidebar names and feedback data */}
      
      {/* TODO: Add other components later */}
      {/* <OutboundLinks /> */}
    </section>
  );
}
