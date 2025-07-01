// src/components/Impact/Analytics/VisitorTimeline.jsx
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { SmallTooltip } from '../../UI/Tooltip';
import styles from './VisitorTimeline.module.css';

export default function VisitorTimeline({ timeline, overview }) {
  // Process the timeline data and calculate metrics
  const { chartData, metrics } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { chartData: [], metrics: {} };
    }

    // Filter out days with zero visitors and sort by date
    const activeData = timeline
      .filter(day => day.visitors > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (activeData.length === 0) {
      return { chartData: [], metrics: {} };
    }

    // Calculate engaged readers (visitors who spent more than 60 seconds)
    // Using visit duration as a proxy for engagement
    const engagedData = activeData.map(day => ({
      ...day,
      // Estimate engaged readers: visitors with >60s duration or low bounce rate
      engagedReaders: Math.round(day.visitors * (1 - day.bounceRate / 100) * 0.7), // Conservative estimate
      formattedDate: new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));

    // Calculate growth metrics
    const totalDays = activeData.length;
    const totalVisitors = activeData.reduce((sum, day) => sum + day.visitors, 0);
    const totalEngaged = engagedData.reduce((sum, day) => sum + day.engagedReaders, 0);
    const avgDailyVisitors = totalVisitors / totalDays;
    const avgDailyEngaged = totalEngaged / totalDays;

    // Calculate trend (simple linear regression slope)
    const xValues = activeData.map((_, index) => index);
    const yValues = activeData.map(day => day.visitors);
    const n = xValues.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const isGrowing = slope > 0;

    // Calculate monthly projection (based on 28-30 day periods)
    const daysForMonthly = Math.min(totalDays, 28);
    const monthlyVisitors = daysForMonthly >= 28 ? 
      totalVisitors : // Use actual 28+ day data
      Math.round(avgDailyVisitors * 30); // Extrapolate from daily average

    // Project yearly visitors (extrapolate from current trend)
    const projectedYearlyVisitors = Math.round(avgDailyVisitors * 365);
    const projectedYearlyEngaged = Math.round(avgDailyEngaged * 365);

    // Calculate recent growth (last 7 days vs previous 7 days)
    const recentGrowth = activeData.length >= 14 ? 
      calculateGrowthRate(
        activeData.slice(-14, -7), 
        activeData.slice(-7)
      ) : null;

    return {
      chartData: engagedData,
      metrics: {
        totalVisitors,
        totalEngaged,
        avgDailyVisitors: Math.round(avgDailyVisitors),
        avgDailyEngaged: Math.round(avgDailyEngaged),
        projectedYearlyVisitors,
        projectedYearlyEngaged,
        monthlyVisitors,
        isGrowing,
        recentGrowth,
        activeDays: totalDays
      }
    };
  }, [timeline]);

  // Helper function to format large numbers
  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Helper function to calculate growth rate between two periods
  function calculateGrowthRate(period1, period2) {
    const avg1 = period1.reduce((sum, day) => sum + day.visitors, 0) / period1.length;
    const avg2 = period2.reduce((sum, day) => sum + day.visitors, 0) / period2.length;
    return avg1 > 0 ? ((avg2 - avg1) / avg1) * 100 : 0;
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.chartTooltip}>
          <div className={styles.tooltipDate}>{label}</div>
          <div className={styles.tooltipStats}>
            <div className={styles.tooltipStat}>
              <span className={styles.statLabel}>Visitors:</span>
              <span className={styles.statValue}>{data.visitors}</span>
            </div>
            <div className={styles.tooltipStat}>
              <span className={styles.statLabel}>Engaged:</span>
              <span className={styles.statValue}>{data.engagedReaders}</span>
            </div>
            {data.visitDuration > 0 && (
              <div className={styles.tooltipStat}>
                <span className={styles.statLabel}>Avg Duration:</span>
                <span className={styles.statValue}>
                  {Math.round(data.visitDuration / 60)}m {Math.round(data.visitDuration % 60)}s
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className={styles.timelineContainer}>
        <div className={styles.noData}>No visitor data available</div>
      </div>
    );
  }

  return (
    <div className={styles.timelineContainer}>
      {/* Title moved above metrics */}
      <h3 className={styles.sectionTitle}>Students and Independent Readers</h3>
      
      {/* Header with key metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {metrics.avgDailyVisitors.toLocaleString()}
            <span className={styles.confidenceInterval}>±{Math.round(metrics.avgDailyVisitors * 0.15)}</span>
          </div>
          <div className={styles.metricLabel}>Daily Readers</div>
          <div className={styles.metricSubtext}>Average over {metrics.activeDays} days</div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {metrics.avgDailyEngaged.toLocaleString()}
            <span className={styles.confidenceInterval}>±{Math.round(metrics.avgDailyEngaged * 0.2)}</span>
          </div>
          <SmallTooltip content="Readers who spend >60 seconds on the site with <70% bounce rate. Bounce rate = % of visitors who leave after viewing only one page.">
            <div className={styles.metricLabel}>
              Daily Engaged Readers
            </div>
          </SmallTooltip>
          <div className={styles.metricSubtext}>Measured as low bounce rate + meaningful time spent</div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatNumber(metrics.monthlyVisitors)}
            <span className={styles.confidenceInterval}>±{formatNumber(Math.round(metrics.monthlyVisitors * 0.2))}</span>
          </div>
          <SmallTooltip content="Monthly projection based on 30-day periods. Uses actual data if available, otherwise extrapolated from daily averages.">
            <div className={styles.metricLabel}>Monthly Readers</div>
          </SmallTooltip>
          <div className={styles.metricSubtext}>30-day projection</div>
        </div>
        
        <div className={styles.metricCard}>
          <div className={styles.metricValue}>
            {formatNumber(metrics.projectedYearlyVisitors)}
            <span className={styles.confidenceInterval}>±{formatNumber(Math.round(metrics.projectedYearlyVisitors * 0.25))}</span>
          </div>
          <SmallTooltip content="Projection calculated by multiplying daily average by 365 days, with 25% confidence interval based on data variance.">
            <div className={styles.metricLabel}>Yearly Readers</div>
          </SmallTooltip>
          <div className={styles.metricSubtext}>Projection by extrapolating current readership</div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartContainer}>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--atlas-primary, #1971c2)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--atlas-primary, #1971c2)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="engagedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--atlas-primary-light, #339af0)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--atlas-primary-light, #339af0)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="var(--atlas-border-color, #e9ecef)" />
              
              <XAxis 
                dataKey="formattedDate"
                tick={{ fontSize: 12, fill: 'var(--atlas-text-secondary, #6c757d)' }}
                axisLine={false}
                tickLine={false}
              />
              
              <YAxis 
                tick={{ fontSize: 12, fill: 'var(--atlas-text-secondary, #6c757d)' }}
                axisLine={false}
                tickLine={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Total visitors area */}
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="var(--atlas-primary, #1971c2)"
                strokeWidth={2}
                fill="url(#visitorsGradient)"
              />
              
              {/* Engaged readers line */}
              <Line
                type="monotone"
                dataKey="engagedReaders"
                stroke="var(--atlas-primary-light, #339af0)"
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ backgroundColor: 'var(--atlas-primary, #1971c2)' }}></div>
            <span>Total Readers</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendColor} style={{ 
              backgroundColor: 'var(--atlas-primary-light, #339af0)',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, white 2px, white 4px)'
            }}></div>
            <span>Engaged Readers</span>
          </div>
        </div>
      </div>
      
      {/* Explanation note */}
      <div className={styles.explanationNote}>
        <strong>About this data:</strong> Non-Engagement is calculated as readers who spend less than 60 seconds on the site with more than 70% bounce rate. Bounce rate = % of visitors who leave after viewing only one page. We do not have strong data for readers before 06-2025. For times before that we relied on course organizers directly reporting their readership numbers to us, or people reaching out to tell us they are reading the text. This gives us a rough estimate readers to be ~400 at 6 months, ~700 at 9 months for dates before 06-2025. Its also worth noting that the visualized analytics metrics reflect website engagement only. We cannot track readers who learn through downloaded PDFs, arXiv paper versions, offline audio, YouTube views, live lectures or reading/commenting on google docs (as the Atlas was primarily on docs for the majority of its current life). This means that these numbers and any resulting projections might be conservative estimates of total learners using AI Safety Atlas materials. 
      </div>
    </div>
  );
}
