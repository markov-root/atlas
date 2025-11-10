// config/navbar.mjs - Clean, working navbar with About dropdown
export const navbarConfig = {
  title: '',
  logo: {
    alt: 'AI Safety Atlas Logo',
    src: '/img/logo_samples/01-test.png',
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
    {
      label: 'About',
      position: 'right',
      type: 'dropdown',
      items: [
        {
          to: '/impact/',
          label: 'Impact',
        },
        {
          to: '/faq/',
          label: 'FAQ',
        },
      ],
    },
    // No custom items - just clean navbar with search
  ],
};
