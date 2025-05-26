(function() {
  document.addEventListener('DOMContentLoaded', function() {
    function moveToSidebar() {
      // Find right sidebar TOC
      const rightTOC = document.querySelector('.table-of-contents');
      if (!rightTOC) return;
      
      // Find sidebar menu
      const sidebarNav = document.querySelector('.menu');
      if (!sidebarNav) return;
      
      // Create TOC container
      const tocContainer = document.createElement('div');
      tocContainer.className = 'sidebar-toc-container';
      tocContainer.style.marginTop = '2rem';
      tocContainer.style.paddingTop = '1rem';
      tocContainer.style.borderTop = '1px solid var(--ifm-toc-border-color)';
      
      // Add title
      const tocTitle = document.createElement('h3');
      tocTitle.textContent = 'On This Page';
      tocTitle.style.fontSize = '0.8rem';
      tocTitle.style.fontWeight = 'bold';
      tocTitle.style.textTransform = 'uppercase';
      tocTitle.style.color = 'var(--ifm-color-emphasis-700)';
      tocTitle.style.paddingLeft = '1rem';
      tocTitle.style.marginBottom = '0.5rem';
      
      // Clone TOC and add it
      const tocClone = rightTOC.cloneNode(true);
      
      // Add to container
      tocContainer.appendChild(tocTitle);
      tocContainer.appendChild(tocClone);
      
      // Add to sidebar
      sidebarNav.appendChild(tocContainer);
      
      // Hide right TOC container
      const rightContainer = document.querySelector('.col.col--3');
      if (rightContainer) {
        rightContainer.style.display = 'none';
      }
      
      // Make content wider
      const contentContainer = document.querySelector('.col.col--9');
      if (contentContainer) {
        contentContainer.style.flexBasis = '100%';
        contentContainer.style.maxWidth = '100%';
      }
    }
    
    // Run on page load
    moveToSidebar();
    
    // Watch for client-side navigation
    const observer = new MutationObserver(function(mutations) {
      // Check for content changes that indicate page navigation
      const shouldUpdate = mutations.some(mutation => 
        mutation.target.classList && 
        mutation.target.classList.contains('container') && 
        mutation.addedNodes.length > 0
      );
      
      if (shouldUpdate) {
        setTimeout(moveToSidebar, 100);
      }
    });
    
    // Observe the main container for changes
    const docContainer = document.querySelector('.container');
    if (docContainer) {
      observer.observe(docContainer.parentNode, { 
        childList: true,
        subtree: true 
      });
    }
  });
})();
