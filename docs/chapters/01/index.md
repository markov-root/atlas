---
title: "Capabilities"
chapter_number: 1
chapter_description: "We need to understand what AI models are currently capable of, and what the trends for their capabilities indicate."
reading_time_core: "61 min"
reading_time_optional: "10 min"
reading_time_appendix: "18 min"
authors:
  - "Markov Grey"
  - "Charbel-Raphaël Segerie"
affiliations: ["French Center for AI Safety (CeSIA)"]
alignment_forum_link: "https://www.alignmentforum.org/posts/MkfaQyxB9PN4h8Bs9/"
google_docs_link: "https://docs.google.com/document/d/1HKo0Kest9Xppjn7m2ODpfMUlEu93SzLsfxXBH48Xaus/edit?usp=sharing"
video_link: "https://www.youtube.com/watch?v=J_iMeH1hb9M"
sidebar_position: 1
slug: /chapters/01/
---
import Note from "@site/src/components/chapters/Note";
import Quote from "@site/src/components/chapters/Quote";
import Definition from "@site/src/components/chapters/Definition";

import Figure from "@site/src/components/chapters/Figure";

# Introduction

<Quote speaker="Yann LeCun" position="Chief AI scientist at Meta and Turing Prize winner" date="May 2023" source="([Heaven, 2023](https://www.technologyreview.com/2023/05/02/1072528/geoffrey-hinton-google-why-scared-ai/))">

There is no question that machines will become smarter than humans—in all domains in which humans are smart—in the future. It's a question of when and how, not a question of if.

</Quote>

<video>

[https://www.youtube.com/watch?v=J_iMeH1hb9M](null)

</video>

<video-caption>

Optional video to get an overview of AI capabilities.

</video-caption>

The field of artificial intelligence has undergone a remarkable transformation in recent years, and this might be only the beginning. This chapter lays the groundwork for the entire book by establishing what AI systems can currently do, how they achieve these capabilities, and how we might anticipate their future development. This understanding is essential for all subsequent chapters: the discussion of dangerous capabilities and potential risks (Chapter 2) follows directly from understanding capabilities. Similarly, proposed technical (Chapter 3) and governance solutions (Chapter 4) both must account for the current and projected future of AI capabilities.

<Figure src="./img/sh2_Image_1.png" alt="Enter image alt description" chapter="1" figure="1" caption="We first explain foundation models, which have been continuously showing improved capabilities due to scale. Then examine empirically observed scaling laws. Based on these trends we look at some techniques that researchers use to try and forecast future AI progress." />

**State-of-the-Art AI - Achieved breakthrough capabilities across multiple domains.** We begin by exploring how AI systems have evolved from narrow, specialized tools to increasingly general-purpose tools. Language models can now engage in complex reasoning, while computer vision systems demonstrate sophisticated understanding of visual information. In robotics, we're seeing the emergence of systems that can learn and adapt to real-world environments with increasing autonomy. The goal of this section is to give the reader many examples from different domains of accelerating AI capabilities.

**Foundation models - Revolutionized how we build AI systems.** The next section explores how we have moved from smaller specialized architectures to large scale general-purpose architectures. Rather than building separate systems for each task, these foundation models serve as the starting point. They are building blocks that can be later adapted for various applications using fine-tuning. We explore how these models are trained, their key properties, and the unique challenges they present. The emergence of unexpected capabilities from these models raises important questions about both their potential and implications for AI safety.

**Understanding Intelligence - Capabilities require precise measurement to guide safety work.** The objective of this section is to provide an understanding of what terms like artificial general intelligence and artificial superintelligence actually mean in practice. Through detailed case studies and empirical observations, we examine different approaches to defining and measuring AI capabilities. Moving beyond traditional binary distinctions between "narrow" and "general" AI, we introduce more nuanced continuous frameworks that track progress along multiple dimensions.

**Scaling - The bitter lesson and empirical scaling laws show that scale drives progress.** We explore how simple algorithms plus massive computation often outperform sophisticated hand-crafted approaches. This leads us to examine scaling laws that describe how AI performance improves with different variables like - data, parameter count and increased computational resources. This section also contains an examination of the debate around whether scale alone is sufficient for achieving transformative AI capabilities.

**Forecasting - Predicting capabilities progress helps us prepare safety measures in advance.** Building on our understanding of current capabilities and scaling behaviors, we examine various approaches to anticipating future progress. From biological anchors to trend analysis, we explore frameworks for making informed predictions about AI development trajectories. This is very important to know when different safety measures need to be in place.

**Appendices - Overview of expert opinions on AI, detailed debates around scale, and scaling trends.** We consider these sections optional, but still useful to those who want to get a little bit of a deeper dive. The chapter concludes with appendices examining expert opinions on AI progress, deeper discussions about the nature and limitations of large language models, and comprehensive data on key trends in AI development.