// config/navbar.mjs - Standardized navbar configuration
export const navbarConfig = {
  title: '',
  logo: {
    alt: 'AI Safety Atlas Logo',
    src: '/img/logo_samples/01.svg', // Standardized with leading slash
  },
  items: [
    {
      to: '/chapters/',
      position: 'right',
      label: 'Textbook',
    },
    {
      to: '/impact/',
      position: 'right',
      label: 'Impact',
    },
    // Courses commented out as requested
    // {
    //   to: '/courses/',
    //   position: 'right',
    //   label: 'Courses',
    // },
    // GitHub link commented out as requested
    // {
    //   href: 'https://github.com/markov-root/atlas',
    //   label: 'GitHub',
    //   position: 'right',
    // },
  ],
};
