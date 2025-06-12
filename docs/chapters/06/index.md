---
title: "Misspecification"
chapter_number: 6
reading_time_core: "55 min"
reading_time_optional: "3 min"
authors:
  - "Markov Grey"
  - "Charbel-Raphael Segerie"
affiliations: ["French Center for AI Safety (CeSIA)"]
acknowledgements:
  - "Jeanne Salle"
  - "Oscar Heitmann"
  - "Ram Rachum"
  - "Nicolas Guillard"
  - "Camille Berger"
atlas_link: "https://ai-safety-atlas.com/chapters/06/"
alignment_forum_link: "https://www.lesswrong.com/s/3ni2P2GZzBvNebWYZ/p/mMBoPnFrFqQJKzDsZ"
google_docs_link: "https://docs.google.com/document/d/1kEdmyVTUG3MO7lwuw4utHEm7CcavvgAiUZcWHaOZuPY/edit?usp=sharing"
feedback_link: "https://forms.gle/ZsA4hEWUx1ZrtQLL9"
teach_link: "https://docs.google.com/document/d/1JfmzGii5QG6hW8AM5WxzDBVyGc14aLV_Lc_1PkK2ZLc/edit?usp=sharing"
sidebar_position: 6
slug: /chapters/06/
---
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

# Introduction

**Reinforcement Learning:** The chapter starts with a reminder of some reinforcement learning concepts. This includes a quick dive into the concept of rewards and reward functions. This section lays the groundwork for explaining why reward design is extremely important.

**Optimization:** This section briefly introduces the concept of Goodhart's Law. It provides some motivation behind understanding why rewards are difficult to specify in a way such that they do not collapse in the face of immense optimization pressure.

**Reward misspecification:** With a solid grasp of the notion of rewards and optimization the readers are introduced to one of the core challenges of alignment - reward misspecification. This is also known as the Outer Alignment problem. The section begins by discussing the necessity of good reward design in addition to algorithm design. This is followed by concrete examples of reward specification failures such as reward hacking and reward tampering.

**Learning by Imitation:** This section focuses on some proposed solutions to reward misspecification that rely on learning reward functions through imitating human behavior. It examines proposals such as imitation learning (IL), behavioral cloning (BC), and inverse reinforcement learning (IRL). Each section also contains an examination of possible issues and limitations of these approaches as they pertain to resolving reward hacking.

**Learning by Feedback:** The final section investigates proposals aiming to rectify reward misspecification by providing feedback to the machine learning models. The section also provides a comprehensive insight into how current large language models (LLMs) are trained. The discussion covers reward modeling, reinforcement learning from human feedback (RLHF), reinforcement learning from artificial intelligence feedback (RLAIF), and the limitations of these approaches.