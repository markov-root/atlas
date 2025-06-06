// config/navbar.mjs - Clean, working navbar
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
      to: '/impact/',
      position: 'right',
      label: 'Impact',
    },
    // No custom items - just clean navbar with search
  ],
};
