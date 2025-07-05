---
title: "Governance"
chapter_number: 4
reading_time_core: "73 min"
reading_time_optional: "5 min"
reading_time_appendix: "15 min"
authors:
  - "Charles Martinet"
  - "Markov Grey"
  - "Su Cizem"
affiliations: ["French Center for AI Safety (CeSIA)"]
acknowledgements:
  - "Charbel-Raphael Segerie"
  - "Léo Karoubi"
  - "Ines Belhadj"
google_docs_link: "https://docs.google.com/document/d/1fFVYWes5JQgSc2l9cAMQKprCevw2qW0-4MKMQPnpbxw/edit?usp=sharing"
download_link: "https://github.com/CentreSecuriteIA/textbook/blob/main/latex/AI%20Safety%20Atlas%20-%20Governance.pdf"
feedback_link: "https://forms.gle/ZsA4hEWUx1ZrtQLL9"
video_link: "https://www.youtube.com/watch?v=FSKuDqze9es"
teach_link: "https://docs.google.com/document/d/1tp5rpzw_gekjju-UBp8tkbbnQOuA2QzsPF_um8Z4IOU/edit?tab=t.0#heading=h.fo57hwsn3del"
sidebar_position: 4
slug: /chapters/04/
---
import Quote from "@site/src/components/chapters/Quote";
import Note from "@site/src/components/chapters/Note";
import Definition from "@site/src/components/chapters/Definition";

import Figure from "@site/src/components/chapters/Figure";

# Introduction

<Quote speaker="The Bletchley Declaration" position="Signed by 28 countries, including all AI leaders, and the EU, 2023" date="2023" source="">

Substantial risks may arise from potential intentional misuse or unintended issues of control relating to alignment with human intent. These issues are in part because those capabilities are not fully understood [...] There is potential for serious, even catastrophic, harm, either deliberate or unintentional, stemming from the most significant capabilities of these AI models.

</Quote>

Artificial intelligence has the potential to revolutionize numerous aspects of society, from healthcare to transportation to scientific research. Recent advancements have demonstrated AI's ability to defeat world champions at Go, generate photorealistic images from text descriptions, and discover new antibiotics. However, these developments also raise significant challenges and risks, including job displacement, privacy infringements, and the potential for AI systems to make consequential mistakes or be misused (see the Chapter 2 on Risks for the full spectrum). While technical AI safety research is necessary to ensure AI systems behave reliably and align with human values as they become more capable and autonomous, it alone is insufficient to address the full spectrum of challenges posed by advanced AI systems.

The scope of AI governance is broad, so this chapter will primarily focus on large-scale risks associated with frontier AI, highly capable foundation models that could possess dangerous capabilities sufficient to pose severe risks to public safety ([Anderljung et al., 2023](https://arxiv.org/abs/2307.03718)). We will examine why governance is necessary, how it complements technical AI safety efforts, and the key challenges and opportunities in this rapidly evolving field. Our discussion will center on the governance of commercial and civil AI applications, as military AI governance involves a distinct set of issues that are beyond the scope of this chapter.

<Figure src="./img/ek4_Image_1.png" alt="Enter image alt description" number="1" label="4.1" caption="Distinguishing AI models according to their level of potential harm and generality. We focus here on frontier AI models ([U.K. government, 2023](https://www.gov.uk/government/publications/frontier-ai-capabilities-and-risks-discussion-paper/frontier-ai-capabilities-and-risks-discussion-paper))" />

<Definition term="AI governance" source="([Maas, 2022](https://verfassungsblog.de/paths-untaken/))" number="1" label="4.1">

The study and shaping of governance systems - including norms, policies, laws, processes, politics, and institutions - that affect the research, development, deployment, and use of existing and future AI systems in ways that positively shape societal outcomes. It encompasses both research into effective governance approaches and the practical implementation of these approaches.

</Definition>

**AI governance is not the same as traditional technology governance.** Traditional technology governance relies on several key assumptions that break down when applied to AI. We typically assume we can predict how a technology will be used and its likely impacts, that we can effectively control its development pathway, and that we can regulate specific applications or end-uses. For example, pharmaceutical governance uses clinical trials and approval processes based on intended medical applications, while nuclear technology is controlled through international treaties, safeguards, and monitoring of specific facilities and materials. These approaches work when technologies follow relatively predictable development paths and have clear applications. To understand what makes AI governance uniquely challenging, we can examine AI through three different lenses that each require different governance approaches ([Dafoe, 2022](https://academic.oup.com/edited-volume/41989/chapter-abstract/408516484); [Buchanan, 2020](https://cset.georgetown.edu/publication/the-ai-triad-and-what-it-means-for-national-security-strategy/)).

**AI as general-purpose technology**

**AI transforms many sectors simultaneously, making sector-specific regulation insufficient.** Like electricity or computers before it, AI can reshape healthcare, finance, transportation, and education all at once. Traditional technology governance typically focuses on specific applications - we regulate medical devices differently from automobiles. But when a single AI system can diagnose diseases, trade stocks, and drive cars, our regulatory silos break down. The impacts span across society in ways that make targeted regulation insufficient ([Buchanan, 2020](https://cset.georgetown.edu/publication/the-ai-triad-and-what-it-means-for-national-security-strategy/)).

**AI as information technology**

**AI processes and generates information in unprecedented ways.** Unlike traditional information systems that store and retrieve data, AI can create entirely new content - from photorealistic images to convincing text to synthetic voices. This creates unprecedented challenges around security, privacy, and information integrity. Traditional governance frameworks weren't designed to handle technologies that can rapidly generate and manipulate information at massive scale ([Brundage et al., 2018](https://arxiv.org/pdf/1802.07228)). The speed and scope of potential information impacts outstrip traditional control mechanisms.

**AI as intelligence technology**

**AI introduces unique control challenges as systems become more capable.** As AI systems approach and potentially exceed human cognitive abilities in various domains, they may develop sophisticated ways to evade controls or pursue unintended objectives. We're already seeing glimpses of this with language models that can engage in deception or manipulation when pursuing goals ([Ganguli et al., 2022](https://arxiv.org/abs/2202.07785)). There are several dangerous capabilities (refer back to chapters 1 and 2) which become even more acute when considering that AI systems might develop these capabilities without being explicitly programmed for them ([Woodside, 2024](https://arxiv.org/abs/2206.07682)). The intelligence aspect of AI creates a dynamic where the technology being governed might actively resist or circumvent governance measures, a challenge without precedent in technology regulation.

<Figure src="./img/evb_Image_2.png" alt="Enter image alt description" number="2" label="4.2" caption="The two-dimensional outlook of capabilities and generality. The different curves represent different paths to AGI. Every point on the path corresponds to a different level of AI capability. The specific development trajectory is hard to forecast but progress is continuous." />

**Fundamental governance problems**

**How do these three lenses create governance challenges?** The mixed nature of AI as a general-purpose, information processing, and potentially intelligent technology gives rise to three fundamental problems that make traditional governance approaches inadequate.

<Figure src="./img/fSC_Image_3.png" alt="Enter image alt description" number="3" label="4.3" caption="Summary of the three regulatory challenges posed by frontier AI ([Anderljung, 2023](https://arxiv.org/pdf/2307.03718))" />

## Governance Problems {#01}

### Unexpected Capabilities {#01-01}

**AI systems develop surprising abilities that weren't part of their intended design.** Foundation models have shown "emergent" capabilities that appear suddenly as models scale up with more data, parameters and compute. GPT-3 unexpectedly demonstrated the ability to perform basic arithmetic, while later models showed emergent reasoning capabilities that surprised even their creators ([Ganguli et al., 2022](https://arxiv.org/abs/2202.07785); [Wei et al., 2022](https://arxiv.org/abs/2206.07682)). Recent evaluations found that frontier models can autonomously conduct basic scientific research, hack into computer systems, and manipulate humans through persuasion, none of which were explicit training objectives ([Phuong et al., 2024](https://arxiv.org/abs/2403.13793); [Boiko et al., 2023](https://arxiv.org/abs/2304.05332); [Turpin et al., 2023](https://arxiv.org/abs/2305.04388); [Fang et al., 2024](https://arxiv.org/abs/2402.06664)).

<Figure src="./img/qAQ_Image_4.png" alt="Enter image alt description" number="4" label="4.4" caption="Example of unexpected capabilities. Graphs showing several metrics that improve suddenly and unpredictably as models increase in size ([Ganguli et al., 2022](https://arxiv.org/abs/2202.07785))" />

AI evaluation is still in its early stages: testing frameworks lack established best practices, and the field has yet to mature into a reliable science ([Trusilo, 2024](https://www.tandfonline.com/doi/full/10.1080/15027570.2023.2213985)). While evaluations can reveal some capabilities, they cannot guarantee absence of unknown threats, forecast new emergent abilities, or assess risks from autonomous systems ([Barnett & Thiergart, 2024](https://arxiv.org/html/2412.08653v1)). Predictability itself is a nascent research area, with major gaps in our ability to anticipate how present models behave, let alone future ones ([Zhou et al., 2024](https://arxiv.org/html/2310.06167v3)). Even the most comprehensive test-and-evaluation frameworks struggle with complex, unpredictable AI behavior ([Wojton et al., 2020](https://testscience.org/wp-content/uploads/formidable/20/Autonomy-Lit-Review.pdf)).

### Deployment Safety {#01-02}

**Once deployed, AI systems can be repurposed for harmful applications beyond their intended use.** The same language model trained for helpful dialogue can generate misinformation, assist with cyberattacks, or help design biological weapons. Users regularly discover new capabilities through clever prompting that bypasses safety measures called "jailbreaks" that unlock dangerous functionalities ([Solaiman et al., 2024](https://arxiv.org/abs/2306.05949); [Marchal et al., 2024](https://arxiv.org/abs/2406.13843); [Hendrycks et al., 2023](https://arxiv.org/abs/2306.12001)).

<Figure src="./img/bTo_Image_5.png" alt="Enter image alt description" number="5" label="4.5" caption="A schematic of using autonomous LLM agents to hack websites ([Fang et al., 2024](https://arxiv.org/abs/2402.06664)). Once a dual-purpose technology is public, it can be used for both beneficial and harmful purposes." />

**The rise of AI agents amplifies deployment risks.** We're now seeing autonomous AI agents that can chain together model capabilities in novel ways, using tools and taking actions in the real world. These agents can pursue complex goals over extended periods, making their behavior even harder to predict and control post-deployment ([Fang et al., 2024](https://arxiv.org/abs/2402.06664)).

### Proliferation {#01-03}

**AI capabilities spread rapidly through multiple channels, making containment nearly impossible.** Models can be stolen through cyberattacks, leaked by insiders, or reproduced by competitors within months. The rapid open-source replication of ChatGPT-like capabilities led to models with safety features removed and new dangerous capabilities discovered through community experimentation ([Seger et al., 2023](https://arxiv.org/abs/2311.09227)). With API-based models, techniques like model distillation can even extract capabilities without direct access to model weights ([Nevo et al., 2024](https://www.rand.org/content/dam/rand/pubs/research_reports/RRA2800/RRA2849-1/RAND_RRA2849-1.pdf)).** Physical containment doesn't work for digital goods.** Unlike nuclear materials or dangerous pathogens, AI models are just patterns of numbers that can be copied instantly and transmitted globally. Once capabilities exist, controlling their spread becomes a losing battle against the fundamental nature of digital information.

<Figure src="./img/lrJ_Image_6.png" alt="Enter image alt description" number="6" label="4.6" caption="Examples of Proliferation ([Özcan, 2024](https://cfg.eu/ai-governance-challenges-part-3-proliferation/))." />

## Governance Targets {#02}

The unique challenges associated with AI governance mean we need to carefully choose where and how to intervene in AI development. This requires identifying both what to govern (targets) and how to govern it (mechanisms) ([Anderljung et al., 2023](https://arxiv.org/abs/2307.03718); [Reuel & Bucknall, 2024](https://www.governance.ai/research-paper/open-problems-in-technical-ai-governance)). Governance must intervene at points that address core challenges before they manifest. We can't wait for dangerous capabilities to emerge or proliferate before acting. Instead, we need to identify intervention points in the AI development pipeline that will help us shape AI development proactively.

**Effective governance targets share three essential properties:**

- **Measurability:** We must be able to track and verify what's happening. The amount of computing power used for training can be measured in precise units (floating-point operations), making it possible to set clear thresholds and monitor compliance ([Sastry et al., 2024](https://arxiv.org/abs/2402.08797)).

- **Controllability:** There must be concrete mechanisms to influence the target. It's not enough to identify what matters, we need practical ways to shape it. The semiconductor supply chain, for instance, has clear chokepoints where export controls can effectively limit access to advanced chips ([Heim et al., 2024](https://www.governance.ai/research-paper/governing-through-the-cloud)).

- **Meaningfulness:** Targets should address fundamental aspects of AI development that actually shape capabilities and risks. Regulating superficial aspects like user interfaces might be easy but won't prevent the emergence of dangerous capabilities. Core inputs like compute and data, however, directly determine what kinds of AI systems can be built ([Anderljung et al., 2023](https://arxiv.org/abs/2307.03718))

**Which targets show the most promise?** In the AI development pipeline, several intervention points meet these criteria. Early in development, we can target the compute infrastructure required for training and the data that shapes model capabilities. During and after development, we can implement safety frameworks, monitoring systems, and deployment controls ([Anderljung et. al, 2023](https://arxiv.org/abs/2307.03718); [Heim et al., 2024](https://www.governance.ai/analysis/computing-power-and-the-governance-of-ai); [Hausenloy et al., 2024](https://arxiv.org/abs/2412.03824)). Each target offers different opportunities and faces different challenges, which we'll explore in the following sections.