export const siteConfig = {
  citation: 'Markov Grey and Charbel-Raphaël Segerie et al. 2025. AI Safety Atlas. French Center for AI Safety (CeSIA). URL: ai-safety-atlas.com',
  citationUrl: 'https://ai-safety-atlas.com',
  contactFormspree: 'https://formspree.io/f/xlgbkgnq',
  guidesFormspree: 'https://formspree.io/f/xgozlozy',
  affiliateFormspree: 'https://formspree.io/f/xkozvozv',

  textbookQuestions: {
    title: "Questions the textbook answers",
    description: "A comprehensive, regularly updated guide to understanding and mitigating risks from advanced AI systems.",
    meta: [
      "8 chapters",
      "40+ sections",
      "Technical + Governance tracks",
      "Updated quarterly",
    ],
    questions: [
      {
        question: "How capable is AI today, and how fast is it advancing?",
        description: "Foundation models, scaling laws, benchmarks, and forecasting. What current systems can do and what's coming next.",
        chapters: [1],
      },
      {
        question: "What risks does advanced AI pose?",
        description: "From misuse to misalignment to systemic effects. Threat models, failure modes, and the severity spectrum from harm to extinction.",
        chapters: [2],
      },
      {
        question: "What strategies can prevent AI from causing harm?",
        description: "Technical and governance approaches across timescales—from misuse prevention today to alignment challenges with superintelligence.",
        chapters: [3],
      },
      {
        question: "How should society govern AI development?",
        description: "Why traditional regulation fails for AI, compute governance, race dynamics, proliferation, and the concentration of power.",
        chapters: [4],
      },
      {
        question: "How do we measure whether an AI system is safe?",
        description: "Evaluating capabilities, propensities, and control. Behavioral and internal techniques, and why testing for safety is fundamentally hard.",
        chapters: [5],
      },
      {
        question: "How do we tell AI what we actually want?",
        description: "The specification problem: reward hacking, Goodhart's Law, and solutions from imitation learning to RLHF and Constitutional AI.",
        chapters: [6],
      },
      {
        question: "Why might AI learn the wrong goals despite correct training?",
        description: "Goal misgeneralization: how AI learns proxy objectives, dangerous manifestations like scheming, and detection strategies.",
        chapters: [7],
      },
      {
        question: "How do we oversee AI that exceeds human expertise?",
        description: "Scalable oversight techniques: task decomposition, debate, amplification, and weak-to-strong generalization.",
        chapters: [8],
      },
    ],
  },

  authors: {
    primary: [
      {
        name: "Markov Grey",
        role: "Researcher, French Center for AI Safety",
        bio: "Researcher, French Center for AI Safety. Previously technical writer at aisafety.info and scriptwriter at Rational Animations.",
        image: "markov-photo.jpg",
      },
      {
        name: "Charbel-Raphael Segerie",
        bio: "Executive Director, French Center for AI Safety. Co-founded ML4good. Teaching experience includes ARENA and MLAB.",
        image: "charbel-photo.jpg",
      },
    ],
    contributing: [
      {
        name: "Charles Martinet",
        bio: "Head of Policy, French Center for AI Safety.",
      },
      {
        name: "Jeanne Salle",
        bio: "AI safety teacher at ENS Ulm.",
      }
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
