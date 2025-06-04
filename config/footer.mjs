// config/footer.mjs - Standardized footer configuration
export const footerConfig = {
  style: 'dark',
  logo: {
    alt: 'AI Safety Atlas Logo',
    src: '/img/logo/logo_footer.svg', // Standardized with leading slash
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
          href: 'https://github.com/CentreSecuriteIA/textbook',
        },
        {
          label: 'YouTube',
          href: 'https://youtube.com/@AISafetyAtlas',
        },
      ],
    },
  ],
  copyright: `Copyright © ${new Date().getFullYear()} AI Safety Atlas.`,
};
