---
title: "Strategies"
chapter_number: 3
chapter_description: "How can we mitigate the risks of advanced AI? This chapter surveys the vast strategic landscape to mitigate misuse, alignment and systemic risks."
reading_time_core: "83 min"
reading_time_optional: "37 min"
reading_time_appendix: "18 min"
authors:
  - "Charbel-Raphaël Segerie"
  - "Markov Grey"
affiliations: ["French Center for AI Safety (CeSIA)"]
acknowledgements:
  - "Alexandre Variengien"
  - "Jeanne Salle"
  - "Charles Martinet"
  - "Amaury Lorin"
  - "Alejandro Acelas"
  - "Evander Hammer"
  - "Jessica Wen"
  - "Angélina Gentaz"
  - "Jonathan Claybrough"
  - "Camille Berger"
  - "Josh Thorsteinson"
  - "Pauliina Laine"
alignment_forum_link: "https://www.lesswrong.com/s/3ni2P2GZzBvNebWYZ/p/RzsXRbk2ETNqjhsma"
google_docs_link: "https://docs.google.com/document/d/1ytzVlrj8PpxiyjvmZCJXm5QW3olhTh504-yH0h-wAq0/edit?usp=sharing"
teach_link: "https://docs.google.com/document/d/1cv0gzwSouDjckYHzV7gYbHPKhJZR6bwbJWgHzEJ604Q/edit?usp=sharing"
sidebar_position: 3
slug: /chapters/03/
---
import Video from "@site/src/components/chapters/Video";
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

import Figure from "@site/src/components/chapters/Figure";

# Introduction

This chapter tries to lay out the big picture of AI safety strategy to mitigate the risks explored previously.

AI capabilities advance very rapidly, the strategies designed to ensure safety must also evolve. The first version of this document was written in summer of 2024, this version includes the update during the summer of 2025. Through the course of this chapter, we aim to provide a structured overview of the thinking and ongoing work in AI safety strategy as of 2025. We acknowledge both established methods and emerging research directions.

We have categorized mitigations around preventing misuse of AI, safety mitigations for AGI and ASI, and finally socio-technical approaches that help mitigate concerns more generally across all categories. Even though we have chosen a decomposition for sake of explanation, we advocate for a comprehensive approach that combines many of these strategies instead of pursuing just a few in isolation. Finally we have a combined strategies section, where we attempt to outline one potential way that this combination could look to create a layered defense-in-depth framework.

<Figure src="./img/jOu_Image_1.png" alt="Enter image alt description" number="1" label="3.1" caption="Tentative diagram summarizing the main high-level approaches to make AI development safe." />

<Note title="Beyond the scope of this chapter" collapsed={true}>

While this chapter focuses on strategies directly related to preventing large-scale negative outcomes from AI misuse, misalignment, or uncontrolled development, several related topics are necessarily placed beyond its primary scope:

- AI-generated misinformation: The proliferation of AI-driven misinformation, including deepfakes and biased content generation. Strategies to combat this, such as robust detection systems, watermarking, and responsible AI principles, are mostly beyond the scope of the chapter. These often fall under the umbrella of content moderation, media literacy, and platform governance, distinct from the core technical alignment and control strategies discussed in this chapter.

- Privacy: AI systems often process vast amounts of data, amplifying existing concerns about data privacy.

- Security: Standard security practices, such as encryption, access control, data classification, threat monitoring, and anonymization, are prerequisites for safe AI deployment. Although robust security is vital for measures such as protecting model weights, these standard practices are distinct from the novel safety strategies required to address risks like model misalignment or capability misuse.

- Discrimination and toxicity: While biased or toxic outputs constitute a safety concern, this chapter concentrates on strategies aimed at preventing catastrophic failures.

- Digital mind welfare and rights: We don’t know if AIs should be considered as moral patients. This is a distinct ethical domain concerning our obligations to AI, rather than ensuring safety from AI.

- Errors due to lack of capability: While AI system failures due to a lack of capability or robustness are a source of risk ([AISI, 2025](https://www.aisi.gov.uk/work/aisis-research-direction-for-technical-solutions)), the strategies discussed in this chapter aim to mitigate risks arising from both insufficient robustness and potentially high (but misaligned or misused) capabilities. The solutions to this type of risk are the same as those for other industries: testing, iteration, and enhancing the system's capabilities.

The scope chosen here reflects a common focus within certain parts of the AI safety community on existential or large-scale catastrophic risks arising from powerful, potentially agentic AI systems.

</Note>

<Video type="youtube" videoId="RGh8wP9PjJw" number="1" label="3.1" caption="Optional video from Google DeepMind AGI Safety Course. It gives a quick overview of their alignment approach and how we might categorize different strategies into conceptual buckets." />
