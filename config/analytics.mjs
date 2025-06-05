// config/analytics.mjs
export const analyticsConfig = [
  {
    src: 'https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js',
    defer: true,
    'data-domain': 'ai-safety-atlas.com'
  },
  {
    src: `data:text/javascript;charset=utf-8,${encodeURIComponent(`
      window.plausible = window.plausible || function() { 
        (window.plausible.q = window.plausible.q || []).push(arguments) 
      }
    `)}`,
    defer: true
  }
];
