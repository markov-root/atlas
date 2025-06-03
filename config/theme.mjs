// config/theme.mjs
import {themes as prismThemes} from 'prism-react-renderer';

export const themeConfig = {
  docs: {
    sidebar: {
      hideable: true,
      autoCollapseCategories: true,
    },
  },
  // Disable the table of contents sidebar completely
  tableOfContents: {
    minHeadingLevel: 2,
    maxHeadingLevel: 6,
  },
  
  // Color mode configuration
  colorMode: {
    defaultMode: 'light',
    disableSwitch: false,
    respectPrefersColorScheme: true,
  },
  
  // Prism theme configuration
  prism: {
    theme: prismThemes.github,
    darkTheme: prismThemes.dracula,
  },
  
  // Navbar configuration - inline to avoid circular imports
  navbar: {
    title: '',
    logo: {
      alt: 'AI Safety Atlas Logo',
      src: 'img/logo_samples/01.svg',
    },
    items: [
      {
        to: '/chapters/',
        position: 'right',
        label: 'Textbook',
      },
      {
        to: '/courses/',
        position: 'right',
        label: 'Courses',
      },
      // Removed GitHub link from navbar
    ],
  },
  
  // Footer configuration - inline to avoid circular imports
  footer: {
    style: 'dark',
    logo: {
      alt: 'AI Safety Atlas Logo',
      src: 'img/logo_samples/01.svg',
      href: '/',
    },
    links: [
      {
        title: 'Content',
        items: [
          {
            label: 'Textbook',
            to: '/',
          },
          {
            label: 'Safety Research',
            to: '/chapters/01/',
          },
        ],
      },
      {
        title: 'Community',
        items: [
          {
            label: 'Alignment Forum',
            href: 'https://alignmentforum.org',
          },
          {
            label: 'AI Safety Slack',
            href: 'https://aisafety.com/join-slack',
          },
          {
            label: 'Contribute to Atlas',
            href: 'https://github.com/markov-root/atlas',
          },
        ],
      },
      {
        title: 'Social',
        items: [
          {
            label: 'GitHub',
            href: 'https://github.com/markov-root/atlas',
          },
          {
            label: 'Twitter',
            href: 'https://twitter.com/AISafetyAtlas',
          },
          {
            label: 'LinkedIn',
            href: 'https://linkedin.com/company/ai-safety-atlas',
          },
          {
            label: 'YouTube',
            href: 'https://youtube.com/@AISafetyAtlas',
          },
        ],
      },
    ],
    copyright: `Copyright © ${new Date().getFullYear()} AI Safety Atlas.`,
  },
};
