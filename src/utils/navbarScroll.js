// src/utils/navbarScroll.js - Handle navbar textbook link scrolling
export function setupNavbarScrolling() {
  if (typeof document === 'undefined') return;

  // Function to handle textbook link clicks
  const handleTextbookClick = (e) => {
    // Only handle if we're on the landing page
    if (window.location.pathname === '/' || window.location.pathname === '/chapters' || window.location.pathname === '/chapters/') {
      // Check if there's a textbook section to scroll to
      const firstStream = document.querySelector('#textbook-section') || 
                         document.querySelector('#first-stream') ||
                         document.querySelector('.container[id]');
      
      if (firstStream) {
        e.preventDefault();
        firstStream.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
    // If not on landing page, let the default navigation happen
  };

  // Add event listener to textbook links
  const addTextbookListeners = () => {
    const textbookLinks = document.querySelectorAll('a[href="/chapters/"]');
    textbookLinks.forEach(link => {
      link.addEventListener('click', handleTextbookClick);
    });
  };

  // Set up listeners
  addTextbookListeners();

  // Re-add listeners when navigation changes (for SPA behavior)
  const observer = new MutationObserver(() => {
    addTextbookListeners();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Cleanup function
  return () => {
    observer.disconnect();
  };
}
