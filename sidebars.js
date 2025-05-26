// sidebars.js
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */

// Function to get chapter sidebar - handles both dynamic import and fallback
const getChapterSidebar = (chapterNum) => {
  const paddedNum = String(chapterNum).padStart(2, '0');
  
  try {
    const chapterSidebar = require(`./docs/chapters/${paddedNum}/sidebar`);
    return chapterSidebar;
  } catch (e) {
    return {
      type: 'category',
      label: `Chapter ${chapterNum}`,
      link: {
        type: 'doc',
        id: `chapters/${paddedNum}/index`,
      },
      items: [],
    };
  }
};

// Build the complete sidebars configuration
const sidebars = {
  docs: [
    // Add the chapters index page but hide it from sidebar
    {
      type: 'doc',
      id: 'chapters/index',
      className: 'sidebar-chapters-index', // You can hide this with CSS if needed
    },
    ...Array.from({length: 9}, (_, i) => getChapterSidebar(i + 1)),
  ],
};

module.exports = sidebars;
