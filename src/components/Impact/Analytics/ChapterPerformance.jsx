// src/components/Impact/Analytics/ChapterPerformance.jsx
import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SmallTooltip } from '../../UI/Tooltip';
import styles from './ChapterPerformance.module.css';

// Helper function to get section names from sidebar data
const getSectionNameFromSidebar = (chapterNum, sectionNum, sidebarData = null) => {
  if (!sidebarData) {
    return `Section ${sectionNum}`;
  }
  
  try {
    // Find the chapter in sidebar data
    const chapterKey = `chapter${chapterNum.toString().padStart(2, '0')}`;
    const chapterSidebar = sidebarData[chapterKey];
    
    if (!chapterSidebar || !chapterSidebar.items) {
      return `Section ${sectionNum}`;
    }
    
    // Find the section within the chapter items
    const section = chapterSidebar.items.find(item => {
      // Match section numbers from doc IDs like "chapters/02/1", "chapters/02/2"
      const docId = item.link?.id;
      if (docId) {
        const match = docId.match(/chapters\/\d+\/(\d+)$/);
        if (match && parseInt(match[1]) === sectionNum) {
          return true;
        }
      }
      return false;
    });
    
    if (section && section.label) {
      // Clean up the label - remove "2.X " prefix if present
      return section.label.replace(/^\d+\.\d+\s+/, '');
    }
    
    // Special handling for conclusion sections that might not be in items
    if (sectionNum === 7) {
      const conclusionSection = chapterSidebar.items.find(item => 
        item.label && item.label.toLowerCase().includes('conclusion')
      );
      if (conclusionSection) {
        return conclusionSection.label.replace(/^\d+\.\d+\s+/, '');
      }
    }
    
    return `Section ${sectionNum}`;
  } catch (e) {
    console.warn(`Error parsing sidebar data for ${chapterNum}.${sectionNum}:`, e);
    return `Section ${sectionNum}`;
  }
};

// Helper function to get chapter name from sidebar data
const getChapterNameFromSidebar = (chapterNum, sidebarData = null) => {
  if (!sidebarData) {
    return `Chapter ${chapterNum}`;
  }
  
  try {
    const chapterKey = `chapter${chapterNum.toString().padStart(2, '0')}`;
    const chapterSidebar = sidebarData[chapterKey];
    
    if (chapterSidebar && chapterSidebar.label) {
      // Clean up the label - remove "X. " prefix if present
      return chapterSidebar.label.replace(/^\d+\.\s+/, '');
    }
    
    return `Chapter ${chapterNum}`;
  } catch (e) {
    console.warn(`Error parsing sidebar data for chapter ${chapterNum}:`, e);
    return `Chapter ${chapterNum}`;
  }
};

export default function ChapterPerformance({ chapters, feedbackData = null, sidebarData = null }) {
  const [expandedChapters, setExpandedChapters] = useState(new Set());

  // Process feedback data 
  const processedFeedbackData = useMemo(() => {
    if (!feedbackData || !Array.isArray(feedbackData)) {
      return null;
    }

    const feedbackMap = {};
    
    feedbackData.forEach(feedback => {
      const chapterNum = parseInt(feedback.chapter_number);
      const sectionNum = feedback.section_number ? parseInt(feedback.section_number) : null;
      
      // Create key that matches our expectation
      const key = `${chapterNum}${sectionNum ? `_${sectionNum}` : ''}`;
      
      if (!feedbackMap[key]) {
        feedbackMap[key] = {
          ratings: [],
          understandings: [],
          count: 0
        };
      }
      
      // Add ratings and understanding scores if they exist
      if (feedback.overall_rating !== undefined && feedback.overall_rating !== null) {
        feedbackMap[key].ratings.push(parseFloat(feedback.overall_rating));
      }
      
      if (feedback.understanding !== undefined && feedback.understanding !== null) {
        feedbackMap[key].understandings.push(parseFloat(feedback.understanding));
      }
      
      feedbackMap[key].count++;
    });
    
    // Calculate averages
    const processedMap = {};
    Object.keys(feedbackMap).forEach(key => {
      const data = feedbackMap[key];
      processedMap[key] = {
        avgRating: data.ratings.length > 0 ? 
          data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length : null,
        avgUnderstanding: data.understandings.length > 0 ? 
          data.understandings.reduce((sum, u) => sum + u, 0) / data.understandings.length : null,
        count: data.count
      };
    });
    
    return processedMap;
  }, [feedbackData]);

  // Process and group chapter data with section-level details
  const { chapterData, maxEngagement, maxReaders } = useMemo(() => {
    if (!chapters || chapters.length === 0) return { chapterData: [], maxEngagement: 1, maxReaders: 1 };

    // Group all sections under their parent chapters
    const chapterGroups = {};
    
    chapters.forEach(item => {
      // Skip the chapters index page
      if (item.name === 'Chapters Index') return;
      
      // Clean the path: remove hash fragments, trailing slashes, and normalize
      let cleanPath = item.path.split('#')[0]; // Remove hash fragments
      cleanPath = cleanPath.replace(/\/$/, ''); // Remove trailing slash
      
      // Skip non-chapter content (PDFs, appendices, etc.)
      if (cleanPath.includes('/pdf/') || cleanPath.includes('/A1/') || cleanPath.includes('.pdf')) {
        console.log(`Skipping non-chapter content: ${item.path}`);
        return;
      }
      
      // Extract chapter and section numbers from cleaned path
      const chapterMatch = cleanPath.match(/^\/chapters\/(\d+)(?:\/(\d+))?$/);
      if (!chapterMatch) {
        console.log(`Skipping invalid chapter path: ${item.path} (cleaned: ${cleanPath})`);
        return;
      }
      
      const chapterNum = parseInt(chapterMatch[1]);
      const sectionNum = chapterMatch[2] ? parseInt(chapterMatch[2]) : null;
      
      if (!chapterGroups[chapterNum]) {
        chapterGroups[chapterNum] = {
          chapterNumber: chapterNum,
          totalVisitors: 0,
          totalTimeOnPage: 0,
          totalScrollDepth: 0,
          totalPageviews: 0,
          sections: new Map(), // Use Map to deduplicate sections
          chapterMainPage: null
        };
      }
      
      // Calculate individual metrics for this item
      const avgTimeOnPage = item.timeOnPage || 0;
      const avgScrollDepth = item.scrollDepth || 0;
      const visitors = item.visitors || 0;
      
      // Advanced engagement score: Multi-factor model with diminishing returns
      // Based on cognitive load theory and attention research
      const readership = Math.log10(Math.max(visitors, 1)) / Math.log10(1000); // Log scale for readership
      const timeEngagement = 1 - Math.exp(-avgTimeOnPage / 180); // Exponential saturation at ~3min
      const depthEngagement = Math.pow(avgScrollDepth / 100, 0.7); // Power law for scroll depth
      
      // Weighted composite with research-backed coefficients
      const engagementScore = Math.round(
        (readership * 0.5 + timeEngagement * 0.3 + depthEngagement * 0.2) * 100
      );

      const processedItem = {
        ...item,
        chapterNumber: chapterNum,
        sectionNumber: sectionNum,
        avgTimeOnPage,
        avgScrollDepth,
        visitors,
        engagementScore,
        feedback: processedFeedbackData?.[`${chapterNum}${sectionNum ? `_${sectionNum}` : ''}`] || null,
        cleanPath // Add for debugging
      };
      
      if (sectionNum) {
        // Use section number as key to deduplicate + merge duplicate sections
        const sectionKey = sectionNum;
        const existingSection = chapterGroups[chapterNum].sections.get(sectionKey);
        
        if (existingSection) {
          // Merge duplicate sections by combining visitors and taking weighted averages
          const totalVisitors = existingSection.visitors + visitors;
          const properName = getSectionNameFromSidebar(chapterNum, sectionNum, sidebarData);
          
          const mergedItem = {
            ...processedItem,
            name: properName,
            visitors: totalVisitors,
            pageviews: (existingSection.pageviews || 0) + (item.pageviews || 0),
            // Weighted average for time metrics
            avgTimeOnPage: totalVisitors > 0 ? 
              Math.round(((existingSection.avgTimeOnPage * existingSection.visitors) + (avgTimeOnPage * visitors)) / totalVisitors) : 0,
            avgScrollDepth: totalVisitors > 0 ? 
              Math.round(((existingSection.avgScrollDepth * existingSection.visitors) + (avgScrollDepth * visitors)) / totalVisitors) : 0
          };
          
          // Recalculate engagement score for merged item
          const mergedReadership = Math.log10(Math.max(totalVisitors, 1)) / Math.log10(1000);
          const mergedTimeEngagement = 1 - Math.exp(-mergedItem.avgTimeOnPage / 180);
          const mergedDepthEngagement = Math.pow(mergedItem.avgScrollDepth / 100, 0.7);
          mergedItem.engagementScore = Math.round(
            (mergedReadership * 0.5 + mergedTimeEngagement * 0.3 + mergedDepthEngagement * 0.2) * 100
          );
          
          chapterGroups[chapterNum].sections.set(sectionKey, mergedItem);
          console.log(`Merged section ${chapterNum}.${sectionNum}: ${existingSection.visitors} + ${visitors} = ${totalVisitors} visitors`);
        } else {
          const properName = getSectionNameFromSidebar(chapterNum, sectionNum, sidebarData);
          processedItem.name = properName;
          chapterGroups[chapterNum].sections.set(sectionKey, processedItem);
        }
        
        // Add to chapter totals (this will be corrected when we aggregate)
        chapterGroups[chapterNum].totalVisitors += visitors;
        chapterGroups[chapterNum].totalTimeOnPage += avgTimeOnPage * visitors;
        chapterGroups[chapterNum].totalScrollDepth += avgScrollDepth * visitors;
        chapterGroups[chapterNum].totalPageviews += item.pageviews || 0;
      } else {
        // For main chapter pages, also check for duplicates
        if (chapterGroups[chapterNum].chapterMainPage) {
          // Merge duplicate main chapter pages
          const existing = chapterGroups[chapterNum].chapterMainPage;
          const totalVisitors = existing.visitors + visitors;
          const properName = getChapterNameFromSidebar(chapterNum, sidebarData);
          
          const mergedChapter = {
            ...processedItem,
            name: properName,
            visitors: totalVisitors,
            pageviews: (existing.pageviews || 0) + (item.pageviews || 0),
            avgTimeOnPage: totalVisitors > 0 ? 
              Math.round(((existing.avgTimeOnPage * existing.visitors) + (avgTimeOnPage * visitors)) / totalVisitors) : 0,
            avgScrollDepth: totalVisitors > 0 ? 
              Math.round(((existing.avgScrollDepth * existing.visitors) + (avgScrollDepth * visitors)) / totalVisitors) : 0
          };
          
          // Recalculate engagement score
          const mergedReadership = Math.log10(Math.max(totalVisitors, 1)) / Math.log10(1000);
          const mergedTimeEngagement = 1 - Math.exp(-mergedChapter.avgTimeOnPage / 180);
          const mergedDepthEngagement = Math.pow(mergedChapter.avgScrollDepth / 100, 0.7);
          mergedChapter.engagementScore = Math.round(
            (mergedReadership * 0.5 + mergedTimeEngagement * 0.3 + mergedDepthEngagement * 0.2) * 100
          );
          
          chapterGroups[chapterNum].chapterMainPage = mergedChapter;
          console.log(`Merged chapter ${chapterNum} main page: ${existing.visitors} + ${visitors} = ${totalVisitors} visitors`);
        } else {
          const properName = getChapterNameFromSidebar(chapterNum, sidebarData);
          processedItem.name = properName;
          chapterGroups[chapterNum].chapterMainPage = processedItem;
        }
        
        // Add to chapter totals
        chapterGroups[chapterNum].totalVisitors += visitors;
        chapterGroups[chapterNum].totalTimeOnPage += avgTimeOnPage * visitors;
        chapterGroups[chapterNum].totalScrollDepth += avgScrollDepth * visitors;
        chapterGroups[chapterNum].totalPageviews += item.pageviews || 0;
      }
    });

    // Calculate aggregated metrics for each chapter
    const processedChapters = Object.values(chapterGroups).map(chapter => {
      // For chapter-level metrics, use the main page if available, otherwise aggregate from sections
      let chapterEngagementScore = 0;
      let chapterVisitors = 0;
      let chapterTimeOnPage = 0;
      let chapterScrollDepth = 0;
      
      if (chapter.chapterMainPage) {
        // Use main page metrics for chapter-level display
        chapterEngagementScore = chapter.chapterMainPage.engagementScore;
        chapterVisitors = chapter.chapterMainPage.visitors;
        chapterTimeOnPage = chapter.chapterMainPage.avgTimeOnPage;
        chapterScrollDepth = chapter.chapterMainPage.avgScrollDepth;
      } else {
        // Aggregate from sections if no main page
        chapterVisitors = chapter.totalVisitors;
        chapterTimeOnPage = chapter.totalVisitors > 0 ? 
          Math.round(chapter.totalTimeOnPage / chapter.totalVisitors) : 0;
        chapterScrollDepth = chapter.totalVisitors > 0 ? 
          Math.round(chapter.totalScrollDepth / chapter.totalVisitors) : 0;
        
        // Calculate aggregate engagement score
        const readership = Math.log10(Math.max(chapterVisitors, 1)) / Math.log10(1000);
        const timeEngagement = 1 - Math.exp(-chapterTimeOnPage / 180);
        const depthEngagement = Math.pow(chapterScrollDepth / 100, 0.7);
        
        chapterEngagementScore = Math.round(
          (readership * 0.5 + timeEngagement * 0.3 + depthEngagement * 0.2) * 100
        );
      }

      // Convert Map to Array and sort sections by section number
      const sectionsArray = Array.from(chapter.sections.values())
        .sort((a, b) => (a.sectionNumber || 0) - (b.sectionNumber || 0));

      // Calculate chapter-level feedback averages
      const allSections = sectionsArray.concat(chapter.chapterMainPage ? [chapter.chapterMainPage] : []);
      const sectionsWithFeedback = allSections.filter(s => s.feedback && (s.feedback.avgRating !== null || s.feedback.avgUnderstanding !== null));
      
      let avgRating = null;
      let avgUnderstanding = null;
      let totalFeedbackCount = 0;
      
      if (sectionsWithFeedback.length > 0) {
        const ratingsSum = sectionsWithFeedback.reduce((sum, s) => {
          return sum + (s.feedback.avgRating || 0);
        }, 0);
        const understandingsSum = sectionsWithFeedback.reduce((sum, s) => {
          return sum + (s.feedback.avgUnderstanding || 0);
        }, 0);
        
        const ratingSectionsCount = sectionsWithFeedback.filter(s => s.feedback.avgRating !== null).length;
        const understandingSectionsCount = sectionsWithFeedback.filter(s => s.feedback.avgUnderstanding !== null).length;
        
        totalFeedbackCount = sectionsWithFeedback.reduce((sum, s) => sum + (s.feedback.count || 0), 0);
        
        avgRating = ratingSectionsCount > 0 ? ratingsSum / ratingSectionsCount : null;
        avgUnderstanding = understandingSectionsCount > 0 ? understandingsSum / understandingSectionsCount : null;
      }

      return {
        chapterNumber: chapter.chapterNumber,
        name: getChapterNameFromSidebar(chapter.chapterNumber, sidebarData),
        totalVisitors: chapterVisitors,
        avgTimeOnPage: chapterTimeOnPage,
        avgScrollDepth: chapterScrollDepth,
        engagementScore: chapterEngagementScore,
        avgRating,
        avgUnderstanding,
        feedbackCount: totalFeedbackCount,
        sections: sectionsArray, // Now deduplicated with proper names, always shown
        chapterMainPage: chapter.chapterMainPage
      };
    }).sort((a, b) => a.chapterNumber - b.chapterNumber);

    const maxEng = Math.max(...processedChapters.map(c => c.engagementScore), 1);
    const maxRead = Math.max(...processedChapters.map(c => c.totalVisitors), 1);

    return { chapterData: processedChapters, maxEngagement: maxEng, maxReaders: maxRead };
  }, [chapters, processedFeedbackData, sidebarData]);

  const toggleExpanded = (chapterId) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : null;
  };

  if (chapterData.length === 0) {
    return (
      <div className={styles.performanceContainer}>
        <div className={styles.noData}>No chapter performance data available</div>
      </div>
    );
  }

  return (
    <div className={styles.performanceContainer}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Chapter Performance</h3>
        <div className={styles.subtitle}>
          Combined analytics and feedback data ({chapterData.length} chapters)
        </div>
      </div>

      {/* Desktop Header */}
      <div className={styles.tableHeader}>
        <div className={styles.expandCol}></div>
        <div className={styles.chapterCol}>Chapter</div>
        <div className={styles.readersCol}>
          <span>Readers</span>
        </div>
        <div className={styles.engagementCol}>
          <SmallTooltip content="Readership reach (log scale, 50%), time depth (exponential saturation, 30%), scroll completion (power law, 20%)">
            <span>Engagement</span>
          </SmallTooltip>
        </div>
        <div className={styles.ratingCol}>
          <SmallTooltip content="Average rating from student feedback (0-10 scale)">
            <span>Rating</span>
          </SmallTooltip>
        </div>
        <div className={styles.understandingCol}>
          <SmallTooltip content="Average understanding from student feedback (0-10 scale)">
            <span>Understanding</span>
          </SmallTooltip>
        </div>
      </div>

      {/* Chapter Rows */}
      <div className={styles.chaptersList}>
        {chapterData.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter.chapterNumber);
          const hasExpandableContent = chapter.sections.length > 0;
          
          return (
            <div key={chapter.chapterNumber} className={styles.chapterGroup}>
              {/* Main Chapter Row */}
              <div 
                className={`${styles.chapterRow} ${hasExpandableContent ? styles.clickable : ''}`}
                onClick={hasExpandableContent ? () => toggleExpanded(chapter.chapterNumber) : undefined}
              >
                {/* Expand Button */}
                <div className={styles.expandCell}>
                  {hasExpandableContent ? (
                    <button 
                      className={styles.expandBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(chapter.chapterNumber);
                      }}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  ) : null}
                </div>

                {/* Chapter Info */}
                <div className={styles.chapterCell}>
                  <div className={styles.chapterInfo}>
                    <div className={styles.chapterNumber}>
                      {chapter.chapterNumber.toString().padStart(2, '0')}
                    </div>
                    <div className={styles.chapterName}>{chapter.name}</div>
                  </div>
                </div>

                {/* Readers Count */}
                <div className={styles.readersCell}>
                  <div className={styles.readersCount}>
                    {chapter.totalVisitors.toLocaleString()}
                  </div>
                </div>

                {/* Engagement */}
                <div className={styles.engagementCell}>
                  <div className={styles.engagementBar}>
                    <div 
                      className={styles.engagementBarFill}
                      style={{ 
                        width: `${(chapter.engagementScore / maxEngagement) * 100}%` 
                      }}
                    />
                    <div className={styles.engagementScore}>{chapter.engagementScore}/100</div>
                  </div>
                </div>

                {/* Rating */}
                <div className={styles.ratingCell}>
                  <div className={styles.metricValue}>
                    {chapter.avgRating !== null ? (
                      formatRating(chapter.avgRating)
                    ) : (
                      <img src="/img/icons/coming_soon.svg" alt="No data" className={styles.comingSoonIcon} />
                    )}
                  </div>
                  {chapter.feedbackCount > 0 && (
                    <div className={styles.feedbackCount}>({chapter.feedbackCount})</div>
                  )}
                </div>

                {/* Understanding */}
                <div className={styles.understandingCell}>
                  <div className={styles.metricValue}>
                    {chapter.avgUnderstanding !== null ? (
                      formatRating(chapter.avgUnderstanding)
                    ) : (
                      <img src="/img/icons/coming_soon.svg" alt="No data" className={styles.comingSoonIcon} />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Sections */}
              {isExpanded && chapter.sections.length > 0 && (
                <div className={styles.sectionsContainer}>
                  {chapter.sections.map((section) => (
                    <div key={`${section.chapterNumber}-${section.sectionNumber}`} className={styles.sectionRow}>
                      {/* Empty expand cell to maintain grid alignment */}
                      <div className={styles.expandCell}></div>
                      
                      {/* Section Info */}
                      <div className={styles.chapterCell}>
                        <div className={styles.sectionInfo}>
                          <div className={styles.sectionNumber}>
                            {section.chapterNumber}.{section.sectionNumber}
                          </div>
                          <div className={styles.sectionName}>{section.name}</div>
                        </div>
                      </div>

                      {/* Readers */}
                      <div className={styles.readersCell}>
                        <div className={styles.readersCount}>
                          {section.visitors.toLocaleString()}
                        </div>
                      </div>

                      {/* Engagement */}
                      <div className={styles.engagementCell}>
                        <div className={styles.engagementBar}>
                          <div 
                            className={styles.engagementBarFill}
                            style={{ 
                              width: `${(section.engagementScore / maxEngagement) * 100}%` 
                            }}
                          />
                          <div className={styles.engagementScore}>{section.engagementScore}/100</div>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className={styles.ratingCell}>
                        <div className={styles.metricValue}>
                          {section.feedback?.avgRating !== null && section.feedback?.avgRating !== undefined ? (
                            formatRating(section.feedback.avgRating)
                          ) : (
                            <img src="/img/icons/coming_soon.svg" alt="No data" className={styles.comingSoonIcon} />
                          )}
                        </div>
                        {section.feedback?.count > 0 && (
                          <div className={styles.feedbackCount}>({section.feedback.count})</div>
                        )}
                      </div>

                      {/* Understanding */}
                      <div className={styles.understandingCell}>
                        <div className={styles.metricValue}>
                          {section.feedback?.avgUnderstanding !== null && section.feedback?.avgUnderstanding !== undefined ? (
                            formatRating(section.feedback.avgUnderstanding)
                          ) : (
                            <img src="/img/icons/coming_soon.svg" alt="No data" className={styles.comingSoonIcon} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Data Source Note */}
      <div className={styles.explanationNote}>
        <strong>Data sources:</strong> Analytics from Plausible (readers, engagement). 
        {processedFeedbackData ? 
          "Feedback from student ratings via Formspree submissions." : 
          "Student feedback integration available - data will appear as users submit feedback."
        }
      </div>
    </div>
  );
}
