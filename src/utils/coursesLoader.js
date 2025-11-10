// src/utils/coursesLoader.js
// Auto-discovery loader for course organizations
// Automatically loads all .json files from data/courses/organizations/ folder

import metadata from '../data/courses/courses-metadata.json';

/**
 * Load and aggregate course data from new modular structure
 * @returns {Object} Aggregated course data with organizations array and all metadata
 */
function loadCoursesData() {
  let organizations = [];

  try {
    // Use webpack's require.context to scan organizations/ folder at build time
    const organizationContext = require.context(
      '../data/courses/organizations',  // Directory to scan
      false,                             // Don't scan subdirectories
      /\.json$/                          // Only .json files
    );

    // Load all organization files
    organizations = organizationContext
      .keys()
      .map(key => organizationContext(key))
      .filter(org => org && org.name); // Ensure valid organization objects

    console.log(`[Courses Loader] Loaded ${organizations.length} organizations from new structure`);
  } catch (error) {
    console.warn('[Courses Loader] No organizations found in new structure');
  }

  // If no organizations loaded, return empty structure with metadata
  // (Fallback removed since we're fully on the new structure)
  if (organizations.length === 0) {
    console.warn('[Courses Loader] No organizations found, returning empty structure');
    
    return {
      metadata,
      organizations: [],
      certificateInfo: metadata.defaultCertificate,
      hero: metadata.hero,
      page: metadata.page,
      labels: metadata.labels,
      sections: metadata.sections
    };
  }

  // New structure: return auto-discovered organizations with full metadata
  return {
    metadata,
    organizations,
    certificateInfo: metadata.defaultCertificate,
    hero: metadata.hero,
    page: metadata.page,
    labels: metadata.labels,
    sections: metadata.sections
  };
}

// Export the loaded data
export default loadCoursesData();
