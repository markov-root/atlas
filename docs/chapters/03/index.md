---
title: "Strategies"
chapter_number: 3
reading_time_core: "79 min"
reading_time_optional: "35 min"
reading_time_appendix: "16 min"
authors:
  - "Charbel-Raphaël Segerie"
  - "Markov Grey"
affiliations: ["French Center for AI Safety (CeSIA)"]
alignment_forum_link: "https://www.lesswrong.com/s/3ni2P2GZzBvNebWYZ/p/RzsXRbk2ETNqjhsma"
google_docs_link: "https://docs.google.com/document/d/1WTyLHyaJ_NEDEu49U_hh7oz0-AOQfp7uOJKLck-7A78/edit?usp=sharing"
feedback_link: "https://forms.gle/ZsA4hEWUx1ZrtQLL9"
teach_link: "https://docs.google.com/document/d/1cv0gzwSouDjckYHzV7gYbHPKhJZR6bwbJWgHzEJ604Q/edit?usp=sharing"
sidebar_position: 3
slug: /chapters/03/
---
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

import Figure from "@site/src/components/chapters/Figure";

# Introduction

This chapter tries to lay out the big picture of AI safety strategy to mitigate the risks explored in the previous chapter.

As AI capabilities continue their rapid advance, the strategies designed to ensure safety must also evolve, this is why the first version of this document has been written in July 2024, and has been updated in late May 2025. We talk about technical approaches, and try to articulate this chapter with the other chapters of the book. The aim is to provide a structured overview of current thinking and ongoing work in AI safety strategy, acknowledging both established methods and emerging research directions. For each type of macro problem like misuses, AGI alignment, we list different macro strategies that can help mitigate those risks. Those strategies can generally be combined, and should be combined! We discuss the sequencing of the different strategies at the end of the chapter.

<Figure src="./img/TtT_Image_1.png" alt="Enter image alt description" number="1" label="3.1" caption="Tentative diagram summarizing the main high-level approaches to make AI development safe." />

**Beyond the scope of this chapter**

While this chapter focuses on strategies directly related to preventing large-scale negative outcomes from AI misuse, misalignment, or uncontrolled development, several related topics are necessarily placed beyond its primary scope:

- **AI-generated misinformation:** The proliferation of AI-driven misinformation, including deepfakes and biased content generation. Strategies to combat this, such as robust detection systems, watermarking, and responsible AI principles, are mostly beyond the score of the chapter. These often fall under the umbrella of content moderation, media literacy, and platform governance, distinct from the core technical alignment and control strategies discussed in this chapter.

- **Privacy:** AI systems often process vast amounts of data, amplifying existing concerns about data privacy.

- **Security:** Standard security practices like encryption, access control, data classification, threat monitoring, and anonymization are prerequisites for safe AI deployment. Although robust security is vital for measures like protecting model weights, these standard practices are distinct from the novel safety strategies needed to address risks like model misalignment or capability misuse.

- **Discrimination and toxicity:** While biased or toxic outputs constitute a safety concern, this chapter concentrates on strategies aimed at preventing catastrophic failures.

- **Digital mind welfare and rights:** We don’t know if AIs should be considered as moral patient. This is a distinct ethical domain concerning our obligations to AI, rather than ensuring safety from AI.

- **Errors due to lack of capability:** While AI system failures due to lack of capability or capability or robustness are a source of risk ([AISI, 2025](https://www.aisi.gov.uk/work/aisis-research-direction-for-technical-solutions))., the strategies discussed in this chapter are aimed at mitigating risks arising from both insufficient robustness and potentially high (but misaligned or misused) capabilities. And the solutions to this type of risk are the same as for other industries: testing, iteration, and making the system more capable.

The scope chosen here reflects a common focus within certain parts of the AI safety community on existential or large-scale catastrophic risks arising from powerful, potentially agentic AI systems.