---
title: "Misgeneralization"
chapter_number: 7
reading_time_core: "35 min"
reading_time_optional: "2 min"
authors: ["Markov Grey"]
affiliations: ["French Center for AI Safety (CeSIA)"]
acknowledgements:
  - "Maxime Riché"
  - "Martin"
  - "Fabien Roger"
  - "Jeanne Salle"
  - "Camille Berger"
  - "Leo Karoubi"
google_docs_link: "https://docs.google.com/document/d/10aqDKJgqonHNc9IMMogtda64u8V_JsPlbuzruBMUmAU/edit?usp=sharing"
feedback_link: "https://forms.gle/ZsA4hEWUx1ZrtQLL9"
teach_link: "https://docs.google.com/document/d/1uQooTncb7Hw2NhITtr3S5iGHqT6cvj74c0SZ4Unad_M/edit?usp=sharing"
sidebar_position: 7
slug: /chapters/07/
---
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

# Introduction

**Goal Misgeneralization:** This section introduces the concept of goals as distinct from rewards. It explains what it might be if a model's capabilities generalize, while the goals do not. The section provides various examples of game playing agents, LLMs and other thought experiments to show how this could be a potentially catastrophic failure mode distinct from reward misspecification.

**Inner Alignment:** The next section begins with an explanation of the machine learning process, and how it can be seen as analogous to search. Since the machine learning process can be seen analogous to search, one type of algorithm that can be “found" is an optimizer. This motivates a discussion of the distinction between base and mesa-optimizers.

**Deceptive Alignment:** Having understood mesa-optimizers, the next section introduces the different types of mesa-optimizers that can arise as well as the corresponding failure modes. This section also explores training dynamics that could potentially increase or decrease the likelihood of the emergence of deceptive alignment.