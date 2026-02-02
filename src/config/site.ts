export const siteConfig = {
  citation: 'Markov Grey and Charbel-Raphaël Segerie et al. 2025. AI Safety Atlas. French Center for AI Safety (CeSIA). URL: ai-safety-atlas.com',
  citationUrl: 'https://ai-safety-atlas.com',
  contactFormspree: 'https://formspree.io/f/xlgbkgnq',
  guidesFormspree: 'https://example.com',
  affiliateFormspree: 'https://example.com',

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
