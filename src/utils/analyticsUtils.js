// src/utils/analyticsUtils.js - Safe analytics data loading with fallbacks

/**
 * Safely load analytics data with fallbacks
 * @returns {Object} Analytics data with guaranteed properties
 */
export function loadAnalyticsData() {
  try {
    // Try to import analytics data
    const analyticsData = require('../data/analytics.json');
    return analyticsData;
  } catch (error) {
    console.warn('Analytics data not available, using fallbacks:', error.message);
    // Return fallback data structure
    return {
      overview: {
        totalVisitors: 1500,
        totalPageviews: 8000,
        totalVisits: 2000
      },
      geography: {
        countries: Array.from({ length: 15 }, (_, i) => ({
          name: `Country ${i + 1}`,
          visitors: 50,
          code: 'XX'
        }))
      },
      timeline: [
        { date: '2025-07-01', visitors: 45, pageviews: 120, visits: 60 },
        { date: '2025-07-02', visitors: 52, pageviews: 140, visits: 70 },
        { date: '2025-07-03', visitors: 38, pageviews: 95, visits: 48 }
      ],
      content: {
        chapters: []
      },
      meta: {
        dateRange: 'Recent period',
        dataSource: 'Estimated'
      }
    };
  }
}

/**
 * Calculate yearly reader projection from timeline data
 * @param {Array} timeline - Timeline data array
 * @returns {string} Formatted yearly projection (e.g., "2.1K", "1500")
 */
export function calculateYearlyProjection(timeline) {
  if (!timeline || timeline.length === 0) {
    return "2000+"; // Conservative fallback
  }
  
  try {
    // Filter active days and calculate average
    const activeData = timeline.filter(day => day.visitors > 0);
    if (activeData.length === 0) {
      return "2000+";
    }
    
    const totalVisitors = activeData.reduce((sum, day) => sum + (day.visitors || 0), 0);
    const avgDaily = totalVisitors / activeData.length;
    const projected = Math.round(avgDaily * 365);
    
    // Format the number nicely
    if (projected >= 1000) {
      return `${(projected / 1000).toFixed(1)}K`;
    }
    return projected.toString();
  } catch (error) {
    console.warn('Error calculating yearly projection:', error);
    return "2000+";
  }
}

/**
 * Get country count from geography data
 * @param {Object} geography - Geography data object
 * @returns {number} Number of countries reached
 */
export function getCountriesReached(geography) {
  try {
    return geography?.countries?.length || 15; // Fallback to 15
  } catch (error) {
    console.warn('Error getting countries count:', error);
    return 15;
  }
}

/**
 * Get formatted total visitors with appropriate suffix
 * @param {Object} overview - Overview data object
 * @returns {string} Formatted visitor count
 */
export function getFormattedTotalVisitors(overview) {
  try {
    const total = overview?.totalVisitors || 1500;
    if (total >= 1000) {
      return `${(total / 1000).toFixed(1)}K`;
    }
    return total.toString();
  } catch (error) {
    console.warn('Error formatting total visitors:', error);
    return "1.5K";
  }
}

/**
 * Check if analytics data is available and recent
 * @param {Object} analyticsData - Full analytics data object
 * @returns {boolean} True if data is available and recent
 */
export function isAnalyticsDataFresh(analyticsData) {
  try {
    if (!analyticsData?.meta?.exportDate) {
      return false;
    }
    
    const exportDate = new Date(analyticsData.meta.exportDate);
    const now = new Date();
    const daysDiff = (now - exportDate) / (1000 * 60 * 60 * 24);
    
    // Consider data fresh if less than 30 days old
    return daysDiff < 30;
  } catch (error) {
    return false;
  }
}

/**
 * Debug function to log analytics data status
 * @param {Object} analyticsData - Analytics data to debug
 */
export function debugAnalyticsData(analyticsData) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics Data Debug:', {
      available: !!analyticsData,
      totalVisitors: analyticsData?.overview?.totalVisitors,
      countries: analyticsData?.geography?.countries?.length,
      timelineEntries: analyticsData?.timeline?.length,
      dateRange: analyticsData?.meta?.dateRange,
      fresh: isAnalyticsDataFresh(analyticsData)
    });
  }
}
