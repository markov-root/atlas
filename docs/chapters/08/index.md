---
title: "Scalable Oversight"
chapter_number: 8
reading_time_core: "75 min"
reading_time_optional: "21 min"
authors:
  - "Markov Grey"
  - "Charbel-Raphaël Segerie"
affiliations: ["French Center for AI Safety (CeSIA)"]
google_docs_link: "https://docs.google.com/document/d/1k6rlyBCZJw8xbUx0dzd-4sOhlzj-xzsmwi_OIZY1-3M/edit?usp=sharing"
feedback_link: "https://forms.gle/ZsA4hEWUx1ZrtQLL9"
teach_link: "https://docs.google.com/document/d/1DaygDSW0L5dWuJnpSjYPF2XUbW51UoBJsT1cjLYKc2w/edit?usp=sharing"
sidebar_position: 8
slug: /chapters/08/
---
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

# Introduction

**Oversight.** As AI systems become increasingly capable, ensuring they remain aligned with human values and intentions becomes a critical challenge. This section introduces scalable oversight as a crucial approach to maintaining control over advanced AI. It explains the problems we face in generating training signals for complex, "fuzzy" tasks and the need for new methods to provide accurate feedback. This is important especially as AI models begin to perform tasks beyond human expertise. The section also explores the concept of verification being easier than generation, explaining why this property is fundamental to scalable oversight techniques.

**Task Decomposition.** Building on the need for better oversight methods, this next section explores task decomposition as one key strategy. Task decomposition involves breaking complex tasks into smaller, manageable subtasks, which can be recursively divided further. This approach helps in generating better training signals by simplifying the task that we need to evaluate and verify. Factored cognition extends this concept to replicate human thinking in machine learning (ML) models by decomposing reasoning, complex cognitive tasks.

**Process Oversight.** Another way to help scalable oversight is to address some of the limitations of outcome-based approaches. This section introduces the concept of process-based oversight. We explain Externalized Reasoning Oversight (ERO) and procedural cloning as specific examples. ERO techniques like chain-of-thought (CoT) encourage language models to "think out loud," making their reasoning processes transparent for better oversight and potentially preventing undesirable behaviors. Procedural cloning, an extension of behavioral cloning, aims to replicate not just the final actions but the entire decision-making process of experts. These methods offer a more principled approach to oversight by focusing on the AI's reasoning process rather than just its outputs.

**Iterated Amplification (IA).** Building on the concepts of task decomposition and process oversight, this section outlines amplification and distillation. Amplification enhances the abilities of overseers to solve more complex tasks, while distillation addresses the limitations of amplification, such as complexity and resource use. These processes are combined in Iterated Distillation and Amplification (IDA), a method aimed at generating progressively better training signals for tasks that are difficult to evaluate directly.

**Debate.** This section explores AI Safety via Debate as an adversarial technique for scalable oversight. It describes how AI models arguing for different positions, with a human or AI judge determining the winner, can result in more truthful outcomes. The potential of debate to elicit latent knowledge, improve reasoning, and enhance our ability to oversee complex AI systems is discussed. Key metrics such as the Discriminator Critique Gap (DCG) are introduced, along with the challenges of judging debates. The section also examines the assumptions required for Debate to converge on truth.

**Weak-to-Strong (W2S).** The final section introduces Weak-to-Strong Generalization (W2SG) as a practical approach to scalable oversight, building on insights from previous techniques. It explains how narrowly superhuman models can be used as case studies for scalable oversight techniques. W2SG involves training strong AI models using weak supervision, aiming for the strong model to outperform its weak supervisor by leveraging pre-existing knowledge. The section concludes by discussing various methods of evaluating oversight techniques, including sandwiching evaluations and meta-level adversarial evaluations, providing a way to judge future scalable oversight protocols.