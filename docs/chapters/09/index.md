---
title: "Interpretability"
chapter_number: 9
reading_time_core: "4 min"
reading_time_optional: "1 min"
authors:
  - "Jeanne Salle"
  - "Charbel-Raphaël Segerie"
affiliations: ["French Center for AI Safety (CeSIA)"]
google_docs_link: "https://docs.google.com/document/d/1mdYnniBG5vg4HjMMqqojEs8siFXoRnxi0RfxursBw7A/edit?usp=sharing"
sidebar_position: 9
slug: /chapters/09/
---
import Video from "@site/src/components/chapters/Video";
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

# Introduction

We currently don’t understand how AI models work. We know how to train and build them, meaning we can design them and teach them to perform tasks, such as recognizing objects in images or generating coherent text in response to prompts. However, this does not mean we can always explain their behavior after training. As for now, we can’t explain why a network made a specific decision or produced a particular output. **The goal of interpretability is to understand the inner workings of these networks and explain how they function,** which in turn could allow us to better trust and control AI models.

<Video type="youtube" videoId="KuXjwB4LzSA" number="1" label="9.1" caption="Optional Video. If you are unfamiliar with convolutional neural networks (CNNs), this video will help you get up to speed before reading this chapter." />

<Video type="youtube" videoId="aircAruvnKk" number="2" label="9.2" caption="Optional Video. If you are unfamiliar with transformers, the videos on transformers in this playlist will help you get up to speed before reading this chapter." />

For each method presented in this chapter, we first provide a high-level overview, followed by a more in-depth and technical explanation. The technical explanations can be skipped.