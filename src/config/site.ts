export const siteConfig = {
  citation: 'Markov Grey and Charbel-Raphaël Segerie et al. 2025. AI Safety Atlas. French Center for AI Safety (CeSIA). URL: ai-safety-atlas.com',
  citationUrl: 'https://ai-safety-atlas.com',
  contactFormspree: 'https://formspree.io/f/xlgbkgnq',

  textbookQuestions: {
    title: "Questions the textbook answers",
    description: "A structured journey through the core problems of AI safety—technical and governance.",
    meta: [
      "8 chapters",
      "40+ sections",
      "Technical + Governance tracks",
      "Updated quarterly",
    ],
    questions: [
      {
        question: "How capable is AI today, and how quickly is it progressing?",
        description: "Foundation models, scaling laws, benchmarks, and timelines. What can current systems do, and what might they do soon?",
        chapters: [1],
      },
      {
        question: "Why might advanced AI be dangerous?",
        description: "From misuse to misalignment. Threat models, failure modes, and the landscape of risks from increasingly powerful systems.",
        chapters: [2],
      },
      {
        question: "What strategies can mitigate these risks?",
        description: "Technical and governance approaches. Prevention, alignment, containment, and coordination.",
        chapters: [3],
      },
      {
        question: "How do we govern AI development and deployment?",
        description: "Policy frameworks, international coordination, compute governance, and institutional design.",
        chapters: [4],
      },
      {
        question: "How do we evaluate AI systems at scale?",
        description: "When humans can't directly verify AI outputs, how do we maintain oversight? Scalable evaluation methods and their limits.",
        chapters: [5, 8],
      },
      {
        question: "How do we ensure AI systems behave as intended?",
        description: "Alignment techniques, from RLHF to constitutional AI. Specification, training, and verification.",
        chapters: [6, 7],
      },
    ],
  },

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
