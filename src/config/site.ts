export const siteConfig = {
  citation: 'Markov Grey and Charbel-Raphaël Segerie et al. 2025. AI Safety Atlas. French Center for AI Safety (CeSIA). URL: ai-safety-atlas.com',
  citationUrl: 'https://ai-safety-atlas.com',
  contactFormspree: 'https://formspree.io/f/xlgbkgnq',

  authors: {
    primary: [
      {
        name: "Markov Grey",
        role: "Researcher, French Center for AI Safety",
        bio: "Contributes across all aspects - research, writing, distillation, website development, video creation. Previously scriptwriter at Rational Animations, distillation fellow at AI Safety Info (Stampy). Also currently co-founder and CTO at Equilibria Network. In a previous life has also worked in software development and cybersecurity.",
        image: "markov-photo.jpg",
      },
      {
        name: "Charbel-Raphael Segerie",
        role: "Executive Director, French Center for AI Safety",
        bio: "Leads organization, scientific direction and coordination. Significant pedagogical experience including ARENA projects, MLAB, and Europe's first general purpose AI safety course. Writing featured in BlueDot's interpretability curriculum.",
        image: "charbel-photo.jpg",
      },
    ],
    contributing: [
      {
        name: "Jeanne Salle",
        role: "AI Safety Teacher, ENS Ulm",
        bio: "",
      },
      {
        name: "Charles Martinet",
        role: "Head of Policy, French Center for AI Safety",
        bio: "",
      },
    ],
    advisors: [
      {
        name: "Vincent Corruble",
        bio: "Professor at Sorbonne University and research fellow at CHAI.",
      },
      {
        name: "Fabien Roger",
        bio: "Previously worked at Redwood Research, now at Anthropic.",
      },
    ],
  },
} as const;
