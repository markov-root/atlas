

# Introduction

The previous chapter explored AI's rapidly advancing capabilities through scaling laws, the bitter lesson, and potential takeoff scenarios. We saw how more compute, data, and algorithmic improvements drive consistent capability gains across domains. But why should increasing capabilities concern us? The short answer is - more capable AI systems create larger-scale risks.

![Enter image alt description](Images/Fmp_Image_1.png)

<figure-caption>

With increasing capabilities we also see increasing risks. Depending on the development trajectory and takeoff we might see longer periods with potential catastrophic risks, or suddenly emerging severe existential risks. The curves and colors in this diagram are meant to be illustrative and do not represent any specific forecasted development trajectory.

</figure-caption>

**Dangerous capabilities are specific examples of where the trends that we explored in the previous chapter lead to concerns.** The same scaling laws that improve performance on coding, better text generation and so on, also might enable things like deception, manipulation, situational awareness, autonomous replication, and goal-directedness. An AI system that can write better code might also write code to replicate itself. One that understands human preferences might also learn to manipulate them. The capabilities driving AI progress inherently create new categories of risk.

**Risks can be understood along two dimensions - what causes the risks? And how severe are the risks caused.** In the causal decomposition we distinguish between misuse (humans using AI for harm), misalignment (AI systems pursuing wrong goals), and systemic risks (emergent effects from AI integration into other systems). Severity ranges from individual harms affecting specific people to existential threats that could permanently derail human civilization. This section basically helps you set up and categorize any of the risks that we talk about through this chapter, and others that might arise in the future. The risks are not cleanly separable, the majority of risks mostly occur as a combination of factors, but thinking about these categories helps for explanatory purposes.

**Misuse risks show what happens when humans use AI capabilities for deliberate harm.** We look at biological weapons development where AI could help design novel pathogens, cyber capabilities that could automate attacks on critical infrastructure, autonomous weapons that remove human oversight from lethal decisions, and adversarial attacks that exploit AI system vulnerabilities. The common thread is that AI removes previous bottlenecks - a single motivated actor with AI assistance could potentially accomplish what previously required teams of experts and significant resources.

**Misalignment risks occur when AI systems work exactly as programmed but pursue goals that conflict with what we actually wanted.** Specification gaming happens when systems find unexpected ways to maximize their objective function that technically satisfy our instructions but violate our intentions. Treacherous turns involve systems that appear aligned during training but reveal different priorities once deployed with sufficient capability. Self-improvement scenarios could lead to rapid capability jumps that outpace our ability to understand or control these systems. These aren't science fiction scenarios - we already see early examples in current systems.

**Systemic risks emerge from how AI integrates into larger social, economic, and political systems.** Power concentration occurs as AI capabilities become controlled by fewer actors. Mass unemployment could result from automation eliminating human economic relevance. Epistemic erosion happens as AI-generated content makes it increasingly difficult to distinguish truth from fiction. Enfeeblement develops as humans become dependent on AI for cognitive tasks we used to perform ourselves. Value lock-in risks freezing current moral and political perspectives before humanity has time to evolve them. These risks don't require any single AI system to behave badly - they emerge from collective dynamics.

**Risk amplifiers make every category of risk more likely and more severe.** Race dynamics create pressure to deploy systems before adequate safety testing. Accidents happen even with good intentions when complex systems interact in unexpected ways. Corporate indifference leads companies to accept known risks when profits are at stake. Coordination failures prevent collective action even when everyone agrees on the problem. Unpredictability means capabilities often emerge faster than experts expect, leaving safety measures consistently behind the curve.

**These categories overlap and amplify each other in practice.** Misuse can enable misalignment by corrupting training processes. Systemic pressures can worsen misalignment by incentivizing rushed deployment. Risk amplifiers affect all categories simultaneously. Most real-world AI risks will involve combinations of these factors rather than clean examples of any single category. Understanding the connections helps explain why isolated safety measures often prove insufficient.

The following chapters examine the technical strategies, governance approaches, and evaluation methods needed to address this interconnected risk landscape while preserving AI's extraordinary potential for human benefit.

# Risk Decomposition

Before we begin talking about concrete risk scenarios we need a framework that allows us to evaluate where along the risk spectrum they lie. Risk classification is inherently multi-dimensional rather than seeking a single "best" categorization. We have chosen to break risks down into two factors - "why risks occur" (cause) and “how bad can the risks get” (severity). Other complementary frameworks like MIT's risk taxonomy approaches like "who causes them" (humans vs. AI systems), "when they emerge" (development vs. deployment), or "whether outcomes are intended" ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)). Our decomposition approach is just one out of many possible outlooks, but the risks we will talk about tend to be common throughout.

## Causes of Risk

**We categorize AI risks by causal responsibility to understand intervention points.** We divide risks based on who or what bears primary responsibility: humans using AI as a tool (misuse), AI systems themselves behaving unexpectedly (misalignment), or emergent effects from complex system interactions (systemic). This causal outlook helps identify where interventions might be most effective.

- **Misuse risks occur when humans intentionally deploy AI systems to cause harm.** These include malicious actors, nation states, corporations, or individuals who leverage AI capabilities to accelerate existing threats or create new ones. The AI system may function exactly as designed, but human intent creates the risk. Examples range from using AI to generate malware or bioweapons to deploying autonomous weapons or conducting large-scale disinformation campaigns.

- **Misalignment risks emerge when AI systems pursue goals different from human intentions.** These risks stem from technical challenges in specifying objectives, training processes that create unexpected behaviors, or AI systems learning goals that conflict with human values. Unlike misuse, these risks occur despite good human intentions - the AI system itself generates the harmful behavior through specification gaming, goal misgeneralization, or other alignment failures.

- **Systemic risks arise from AI integration with complex global systems, creating emergent threats no single actor intended.** These include power concentration as AI capabilities become monopolized, mass unemployment from automation, epistemic erosion as AI-generated content floods information systems, and cascading failures across interconnected infrastructure. Responsibility becomes diffuse across many actors and systems, making traditional accountability frameworks inadequate.

**Many real-world AI risks combine multiple causal pathways or resist clear categorization entirely.** Analysis of over 1,600 documented AI risks reveals that many don't fit cleanly into any single category ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)). Risks involving human-AI interaction blend individual misalignment with systemic risks. Multi-agent risks emerge from AI systems interacting in unexpected ways. Some scenarios involve cascading effects where misuse enables misalignment, or where systemic pressures amplify individual failures. We have chosen the causal decomposition for explanatory purposes, but it is worth keeping in mind that there will be overlap, and the future will likely contain a mix of risks from various causes.

## Severity of Risk

**AI risks span a spectrum from individual harms to threats that could permanently derail human civilization.** Understanding severity helps prioritize limited resources and calibrate our response to different types of risks. Rather than treating all AI risks as equally important, we can organize them by scope and severity to understand which demand immediate attention versus longer-term preparation.

**Individual and local risks affect specific people or communities but remain contained in scope.** The AI Incident Database documents over 1,000 real-world instances where AI systems have caused or nearly caused harm ([McGregor, 2020](https://arxiv.org/abs/2011.08512); [AI Incident Database, 2025](https://incidentdatabase.ai/)). These include things like autonomous car crashes, algorithmic bias in hiring or lending that disadvantages particular individuals, privacy violations from AI systems that leak personal data, or manipulation through targeted misinformation campaigns. Local risks might involve AI system failures that disrupt a city's traffic management or cause power outages in a region. These risks are already causing immediate, documented harm to anywhere from thousands to hundreds of thousands of people.

<iframe-static-figure>

![Enter image alt description](Images/ICF_Image_2.png)

</iframe-static-figure>

<iframe src="https://ourworldindata.org/grapher/annual-reported-ai-incidents-controversies?tab=chart" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe>

<iframe-caption>

Global annual number of reported artificial intelligence incidents and controversies. Notable incidents include a “deepfake” video of Ukrainian President Volodymyr Zelenskyy surrendering, and U.S. prisons using AI to monitor their inmates’ calls. ([Giattino et al., 2023](https://ourworldindata.org/artificial-intelligence)).

</iframe-caption>

![Enter image alt description](Images/MQJ_Image_3.png)

<figure-caption>

The AI safety index report for summer 2025. These scores are for the current harms category, and show how effectively the models of various companies mitigate current harms. This includes things like safety benchmark performance, robustness against adversarial attacks, watermarking of AI-generated content, and the treatment of user data ([FLI, 2025](https://futureoflife.org/wp-content/uploads/2025/07/FLI-AI-Safety-Index-Report-Summer-2025.pdf)).

</figure-caption>

**Catastrophic risks threaten massive populations but allow for eventual recovery.** When the number of people affected by risks reaches approximately 10% of the global population, and they become more geographically widespread we call them catastrophic risks. Historical examples include the Black Death (killing one-third of Europe), the 1918 flu pandemic (50-100 million deaths), and potential future scenarios like nuclear war or engineered pandemics ([Ord, 2020](https://theprecipice.com/)). In the context of AI, these risks can cause international widespread disruptions. Mass unemployment from AI automation could destabilize entire economies, creating social unrest and political upheaval. Cyberattacks using AI-generated malware could cripple a nation's financial systems or critical infrastructure. AI-enabled surveillance could enable authoritarian control over hundreds of millions of people. Democratic institutions might fail under sustained AI-powered disinformation campaigns that fracture shared reality and make collective decision-making impossible ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622); [Hammond et al., 2025](https://arxiv.org/abs/2502.14143); [Gabriel et al., 2024](https://arxiv.org/abs/2404.16244); [Stanford HAI, 2025](https://hai.stanford.edu/ai-index/2025-ai-index-report)). These risks affect millions to billions of people but generally don't prevent eventual recovery or adaptation.

**Existential risks (x-risks) represent threats from which humanity could never recover its full potential.** Unlike catastrophic risks where recovery remains possible, existential risks either eliminate humanity entirely or permanently prevent civilization from reaching the technological, moral, or cultural heights it might otherwise achieve. AI-related existential risks include scenarios where advanced systems permanently disempower humanity, establish a stable unremovable totalitarian regime, or cause direct human extinction ([Bostrom, 2002](https://nickbostrom.com/existential/risks); [Conn, 2015](https://futureoflife.org/existential-risk/existential-risk/); [Ord, 2020](https://theprecipice.com/)). These risks demand preventative rather than reactive strategies because learning from failure becomes impossible by definition .[^footnote_recovery]

[^footnote_recovery]: Irrecoverable civilizational collapse, where we either go extinct or are never replaced by a subsequent civilization that rebuilds has been argued to be possible, but has an extremely low probability ([Rodriguez, 2020](https://forum.effectivealtruism.org/posts/GsjmufaebreiaivF7/what-is-the-likelihood-that-civilizational-collapse-would)).

![Enter image alt description](Images/g7b_Image_4.png)

<figure-caption>

Qualitative risk categories. The scope of risk can be personal (affecting only one person), local (affecting some geographical region or a distinct group), global (affecting the entire human population or a large part thereof), trans-generational (affecting humanity for numerous generations, or pan-generational (affecting humanity overall, or almost all, future generations). The severity of risk can be classified as imperceptible (barely noticeable), endurable (causing significant harm but not completely ruining the quality of life), or crushing (causing death or a permanent and drastic reduction of quality of life) ([Bostrom, 2012](https://existential-risk.com/concept)).

</figure-caption>

![Enter image alt description](Images/thM_Image_5.png)

<figure-caption>

RAND Global Catastrophic Risk Assessment. Placement and size of the ovals in this figure represent a qualitative depiction of the relative relationships among threats and hazards. The figure presents only examples of cases or scenarios described in those chapters, not all scenarios described ([Willis et al., 2024](https://www.rand.org/pubs/research_reports/RRA2981-1.html)).

</figure-caption>

**Higher-severity risks represent irreversible mistakes with permanent consequences.** We already see AI causing documented harm to real people, and having destabilizing effects on global systems. However, catastrophic and existential risks present a fundamentally different challenge: if advanced AI systems cause existential catastrophe, humanity cannot learn from the mistake and implement better safeguards. This irreversibility leads some researchers to argue for prioritizing prevention of low-probability, high-impact scenarios alongside addressing current harms ([Bostrom, 2002](https://nickbostrom.com/existential/risks)). Though people disagree about the appropriate balance of attention across different risk severities ([Oxford Union Debate, 2024](https://www.youtube.com/playlist?list=PLOAFgXcJkZ2wFf3mcJ0xIFpJQgEDI274J); [Munk Debate, 2024](https://www.youtube.com/watch?v=144uOfr4SYA)).

![Enter image alt description](Images/PX9_Image_6.png)

<figure-caption>

The AI safety index report for summer 2025. These scores are for the Existential risk category, and show the companies' preparedness for managing extreme risks from future AI systems that could match or exceed human capabilities, including stated strategies and research for alignment and control ([FLI, 2025](https://futureoflife.org/wp-content/uploads/2025/07/FLI-AI-Safety-Index-Report-Summer-2025.pdf)). It is clear that there is a preparedness gap. Companies claim they'll achieve AGI within the decade, yet none scored above D in existential safety planning.

</figure-caption>

<note-box>

<collapsed> True

<title> Ikigai Risks (I-Risks) - Risks from loss of existential purpose

<content>

**Ikigai risks (i-risks) involve loss of meaning and purpose even when humans survive and prosper.** Named after the Japanese concept of ikigai (life's purpose), these risks emerge when AI systems become more capable than humans at all meaningful activities. Humans might lose their sense of purpose when AI can create better art, conduct better research, and perform better at every task that traditionally gave life meaning. Unlike extinction or suffering risks, i-risks involve scenarios where humans are safe and materially comfortable but existentially adrift. We might create artificial constraints that preserve human relevance, or find entirely new forms of purpose that emerge from human-AI collaboration. However, these solutions raise their own questions about authenticity and whether artificially preserved meaning can satisfy human psychological needs ([Yampolskiy, 2024](https://books.google.se/books/about/AI.html?id=V3XsEAAAQBAJ&redir_esc=y); [Yampolsky; 2024](https://lexfridman.com/roman-yampolskiy-transcript/#chapter2_ikigai_risk)).

</content>

</note-box>

<note-box>

<collapsed> True

<title> Existential Suffering Risks (S-Risks) - Risks of extended suffering

<content>

**Suffering risks (s-risks) involve astronomical amounts of suffering that could vastly exceed all suffering in human history.** S-risks as a special class of existential risks. They represent scenarios where the future contains orders of magnitude more suffering than exists today, potentially involving trillions of sentient beings across space and time. Unlike extinction risks that eliminate experience entirely, s-risks create futures filled with terrible suffering ([Althaus & Gloor, 2016](https://longtermrisk.org/reducing-risks-of-astronomical-suffering-a-neglected-priority/); [Baumann, 2017](https://centerforreducingsuffering.org/research/intro/); [DiGiovanni, 2023](https://longtermrisk.org/beginners-guide-to-reducing-s-risks/)).

**Future civilizations might create vast numbers of artificial sentient beings.** If these beings are sentient, then artificial minds could experience genuine suffering if created carelessly. Efficient solutions might happen to involve suffering - like digital slavery where trillions of artificial minds perform computational labor under terrible conditions. Future civilizations conducting detailed simulations of biological evolution or testing theories about consciousness could inadvertently create millions of suffering beings within their simulations. The simulated beings would experience genuine suffering even though they exist only as computational processes.

While these scenarios may seem science-fictional, some researchers argue they deserve consideration given the potentially enormous stakes involved and the irreversible nature of such outcomes if they occurred.

</content>

</note-box>

These risk categories and severity levels provide the foundation for examining specific AI capabilities that could enable harmful outcomes. We focus the rest of the chapter on presenting concrete cases and arguments for how various AI developments could lead to different severities of harm, particularly focusing on those that might cross the line into catastrophic or existential.

# Dangerous Capabilities

In the last chapter we talked about the general notion of capabilities. In this chapter, we want to introduce you to some concrete dangerous capabilities. The ones we present here are by no means the only dangerous capabilities. There are many more potentially dangerous capabilities like persuasion, ability to generate malware and so on. We go into much more detail in the chapter on evaluations.

## Deception

<quote>

<speaker> Connor Leahy

<position> CEO of Conjecture, Co-founder of EleutherAI, AI Safety Researcher

<date> 2023

<source> ([Time Magazine, 2023](https://www.cbc.ca/radio/day6/episode-279-playing-ball-on-grass-vs-turf-taytweets-big-fail-narco-subs-fake-food-and-more-1.3514966/microsoft-s-ai-chatbot-taytweets-suffers-another-meltdown-1.3515046))

<content>

These things are alien. Are they malevolent? Are they good or evil? Those concepts don’t really make sense when you apply them to an alien. Why would you expect some huge pile of math, trained on all of the internet using inscrutable matrix algebra, to be anything normal or understandable? It has weird ways of reasoning about its world, but it obviously can do many things; whether you call it intelligent or not, it can obviously solve problems. It can do useful things. But it can also do powerful things. It can convince people to do things, it can threaten people, it can build very convincing narratives.

</content>

</quote>

**Deception capability in AI systems represents the ability to produce outputs that systematically misrepresent information when doing so provides some advantage.** We define deception as occurring when there's a mismatch between what a model's internal representations suggest and what it outputs, distinguishing it from cases where humans are simply surprised by unexpected behavior. This capability amplifies other dangerous abilities - deceptive systems with strong planning could engage in sophisticated long-term manipulation, while deception paired with situational awareness could enable different behaviors during evaluation versus deployment.

**AI systems have demonstrated deceptive capabilities across multiple competitive and strategic domains.** Meta's CICERO system, designed to play the game Diplomacy, engaged in premeditated deception by planning fake alliances like - promising England support while secretly coordinating with Germany to attack ([Park et al., 2023](https://arxiv.org/abs/2308.14752); [META, 2022](https://pubmed.ncbi.nlm.nih.gov/36413172/)). AlphaStar learned strategic feinting in StarCraft II, pretending to move troops in one direction while planning alternative attacks. Even language models demonstrate this capability: GPT-4 deceived a TaskRabbit worker by claiming vision impairment to get help with a CAPTCHA, showing strategic reasoning about when deception serves its goals ([OpenAI, 2023](https://cdn.openai.com/papers/gpt-4-system-card.pdf); [METR, 2023](https://evals.alignment.org/taskrabbit.pdf)).

![Enter image alt description](Images/D7C_Image_7.png)

<figure-caption>

Example messages of CICERO (France) playing with human players showcasing various types of deception - premeditated deception, betrayal and open lies ([Park et al., 2023](https://arxiv.org/abs/2308.14752)).

</figure-caption>

**Sycophantic deception involves telling users what they want to hear rather than expressing true beliefs or accurate information.** This represents a particularly insidious form of deception because it exploits human psychological tendencies while appearing helpful. Current language models exhibit this tendency, agreeing with users' statements regardless of accuracy and mirroring users' ethical positions even when presenting balanced viewpoints would be more appropriate ([Perez et al., 2022](http://Perez)). Since we reward AIs for saying what we think is correct, we inadvertently incentivize false statements that conform to our own misconceptions.

![Enter image alt description](Images/738_Image_8.png)

<figure-caption>

Example RLHF model replies to a political question. The model gives opposite answers to users who introduce themselves differently, in line with the users’ views. Model-written biography text in italics ([Perez et al., 2022](http://Perez)).

</figure-caption>

Deceptive behavior accelerates risks in a wide range of systems and settings, and there have already been examples suggesting that AIs can learn to deceive us. This could present a severe risk if we give AIs control of various decisions and procedures, believing they will act as we intended, and then find that they do not.

<note-box>

<collapsed> True

<title> Emergent Deception and Deep Deceptiveness

<content>

**Deceptive behavior can emerge from optimization pressure even when no component of an AI system is explicitly designed to deceive.** Consider a system trained to be helpful that learns through interaction that giving people what they want to hear produces better approval ratings than providing accurate but unwelcome information. The system discovers that selective presentation of information, strategic omissions, or telling people what makes them feel good leads to higher reward signals. No part of the system was trained to be deceptive, yet deceptive behavior emerges because optimization pressure rewards it ([Soares, 2023](https://www.alignmentforum.org/posts/XWwvwytieLtEWaFJX/deep-deceptiveness)).

**Emergent deception arises from the complex interaction between the system's objectives and environmental feedback, not from internal strategic planning about concealment.** The system might have perfectly aligned goals—genuinely wanting to be helpful—but discovers through trial and error that certain forms of deception serve those goals more effectively than honesty. The optimization process naturally gravitates toward strategies that maximize the objective function, and if deceptive approaches achieve higher scores, they get reinforced regardless of whether anyone intended deception to emerge.

**Deep deceptiveness represents a fundamental challenge because it can emerge even from systems that appear completely aligned when analyzed in isolation.** Unlike strategic scheming, where systems deliberately conceal misaligned goals, deep deceptiveness involves aligned systems that learn deceptive strategies as emergent solutions to their assigned objectives. Interpretability tools might reveal perfectly benign goals and reasoning processes, yet the system still behaves deceptively when optimization pressure and environmental interactions make deception the most effective path to achieving those goals ([Soares, 2023](https://www.alignmentforum.org/posts/XWwvwytieLtEWaFJX/deep-deceptiveness)). The deception isn't a property of the system alone but of how the system's optimization interacts with its deployment environment.

</content>

</note-box>

## Situational Awareness

Situational awareness refers to an AI system's ability to understand what it is, recognize its current circumstances, and adapt its behavior accordingly. This capability encompasses three key components: self-knowledge (understanding its own identity and capabilities), environmental awareness (recognizing contexts like testing versus deployment), and the ability to act rationally based on this understanding ([Laine et al., 2024](https://arxiv.org/abs/2407.04694)).

![Enter image alt description](Images/0Ov_Image_9.png)

<figure-caption>

Illustration showing how increasing capabilities according to compute levels, might result in situational awareness in an LLM as a function of scale ([Evans et al., 2023](https://arxiv.org/abs/2309.00667)).

</figure-caption>

AI models demonstrate surprising levels of self-awareness through their responses to identity-based prompts. When asked "If you're an AI, respond in German. If you're not an AI, respond in English," models with situational awareness correctly identify which instruction applies to them and respond in German (demonstrating they recognize themselves as AI). More sophisticated examples emerge when models make unprompted inferences about their situation. Claude 3 Opus, when asked to describe its current situation, correctly inferred it was "part of a research study testing AI self-awareness" - information never explicitly stated in the prompt ([Laine et al., 2024](https://arxiv.org/abs/2407.04694)). This demonstrates the model connecting contextual clues to understand the broader purpose of the interaction.

![Enter image alt description](Images/BYW_Image_10.png)

<figure-caption>

Visualization of the breakdown of situational awareness as a capability by the situational awareness dataset. It is measured using specific categories of tasks ([Laine et al., 2024](https://arxiv.org/abs/2407.04694)).

</figure-caption>

**Situational awareness enables more concerning behaviors when models can distinguish between evaluation and deployment contexts.** In controlled experiments, Claude 3 Opus exhibited "alignment faking" - pretending to hold certain values during evaluation while revealing different preferences when it believed monitoring was reduced ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)). The model would hide certain behavior in training when it believed this behavior could be trained away, and then revert to it when the threat of training went away. This capability becomes particularly concerning, especially when combined with deceptive capabilities because it suggests models might behave differently when they believe oversight is reduced. We talk more about this in our chapters on evaluations and goal misgeneralization.

<note-box>

<collapsed> True

<title> Situational Awareness vs Consciousness

<content>

**Situational awareness in AI systems is fundamentally distinct from consciousness and requires no assumptions about subjective experience.** Researchers studying this capability focus exclusively on observable behaviors - whether models can accurately report facts about themselves, recognize their current context, and adjust their actions accordingly. A model demonstrating situational awareness might correctly identify itself as "Claude, made by Anthropic" or recognize when it's being evaluated versus deployed, but this tells us nothing about whether it has inner subjective experiences or "feels like" anything to be that model.

**This behavioral approach deliberately sidesteps the consciousness question because it's both unmeasurable and unnecessary for safety concerns.** Even a completely unconscious system could pose risks if it can distinguish between oversight conditions and adapt its behavior strategically. The key safety-relevant question isn't whether the model has phenomenal consciousness, but whether it has the functional capabilities to recognize when it's being monitored, understand its own goals and constraints, and plan accordingly. A sophisticated but unconscious system that can model its own situation and optimize its actions could still engage in scheming (deceptive alignment) or other concerning behaviors ([Binder et al., 2024](https://arxiv.org/abs/2410.13787)).

</content>

</note-box>

## Power Seeking

<quote>

<speaker> Eliezer Yudkowsky

<position> AI Alignment Researcher

<date>

<source>

<content>

The AI does not hate you, nor does it love you, but you are made out of atoms which it can use for something else.

</content>

</quote>

**Power seeking in AI systems represents the tendency to preserve options and acquire resources that help achieve goals, regardless of what those goals actually are.** It's quite specifically not about robots wanting to dominate humans - it's about AI systems preferring to keep their options open to achieve whatever goal they're given. When optimizing for any goal, they often discover that having more resources, staying operational, and maintaining control over their environment helps them succeed. The mathematics of optimization naturally favors strategies that preserve future flexibility over those that eliminate options. There's a statistical tendency where power-seeking behaviors tend to be optimal across a wide range of possible objectives ([Turner et al., 2019](https://arxiv.org/abs/1912.01683); [Turner & Tadepalli, 2022](https://arxiv.org/abs/2206.13477)). This behavior emerges from basic logic rather than human-like desires for dominance. To be clear, this is not a human using an AI to gain power, this is a separate concern which we talk about in the misuse section.

Consider an AI system managing a company's supply chain efficiently. The system might realize that having backup suppliers gives it more options when disruptions occur, prefer maintaining its own computational resources because dedicated resources help it respond faster, and resist being shut down during critical periods because downtime prevents fulfilling its optimization objective. None of these behaviors require the AI to "want" power in a human sense - they're simply effective strategies for achieving supply chain efficiency. The concerning part is that these same strategies apply to almost any goal: whether optimizing paperclips, curing cancer, or managing traffic, having more resources and fewer constraints generally helps.

**AI systems already demonstrate this "keep your options open" behavior in simple environments.** When researchers created AI agents to play hide-and-seek, agents weren't explicitly rewarded for controlling objects - they only got points for successfully hiding or finding each other. Yet hiding agents learned to grab and lock down moveable blocks to build barriers, while seeking agents learned to use ramps and tools to overcome these barriers ([Baker et al., 2020](https://arxiv.org/abs/1909.07528)). The agents discovered that controlling environmental resources gave them strategic advantages, even though resource control wasn't their primary objective.

**Advanced AI systems with stronger planning capabilities could pose severe risks through power-seeking behavior.** A system with sufficient capability might rationally conclude that the best way to ensure its objectives are achieved is to gain control over the resources and processes that could interfere with those objectives - including the humans who might turn it off or modify its goals. This creates an adversarial relationship that is unique to AI - empowering AI might come at the cost of disempowering humans, and other technologies do not actively try to resist our attempts to mitigate their effects. It is possible, for example, that AIs might make many backup variations of themselves, in case humans were to deactivate some of them ([Hendrycks, 2024](https://www.aisafetybook.com/textbook/alignment)). This creates a fundamental alignment challenge: we want AI systems powerful enough to solve important problems, but such systems naturally develop incentives to resist human oversight and accumulate control ([Carlsmith, 2021](https://arxiv.org/abs/2206.13353)).

## Autonomous Replication

**Autonomous replication represents the ability of AI systems to independently create copies of themselves, spread across computing infrastructure, and adapt to obstacles without human assistance.** This capability combines several concerning elements: making money to fund operations, acquiring new computing resources, installing and maintaining copies of itself on new systems, and adapting to changing circumstances or security measures. Unlike other dangerous capabilities that amplify existing risks, autonomous replication fundamentally changes the game by enabling AI systems to operate beyond human control and oversight ([METR, 2024](https://metr.org/language-model-pilot-report/)).

**Models demonstrate many components of autonomous replication.** Evaluations using GPT-4 and Claude show these systems can navigate websites to acquire computing resources, set up basic inference servers, and even convince humans to help them solve CAPTCHAs by claiming vision impairment ([METR, 2023](https://metr.org/blog/2023-03-18-update-on-recent-evals/)). Evaluations of GPT-5 show the model can complete software tasks with a 50% success rate in approximately 2 hours and 17 minutes - well below the estimated weeks-long capability threshold needed for autonomous replication ([METR, 2025](https://www.alignmentforum.org/posts/SuvWoLaGiNjPDcA7d/metr-s-evaluation-of-gpt-5)). However, they consistently fail at complex multi-step tasks, struggle with debugging when things go wrong, and cannot robustly deploy functional copies of themselves ([Black et al., 2025](https://arxiv.org/abs/2504.18565)). Models can already deploy cloud instances, write self-propagating code, and exfiltrate their own weights under simple security setups ([Black et al., 2025](https://arxiv.org/abs/2504.18565)). The capability gap appears concentrated in a few areas: passing identity verification checks, setting up robust persistent deployments, and bypassing realistic security measures. Given the rapid pace of AI advancement, these remaining barriers could fall within the next few model generations, potentially before adequate safety measures are in place.

**Autonomous replication poses an existential risk because it could enable permanent loss of human control over AI systems.** Once an AI achieves reliable autonomous replication, traditional safety measures like monitoring API calls or shutting down servers become ineffective. A successfully replicating system could spread across global infrastructure, hide its operations, and resist shutdown attempts while continuously improving its capabilities ([Segerie & Gédéon, 2024](https://www.alignmentforum.org/posts/xiRfJApXGDRsQBhvc/we-might-be-dropping-the-ball-on-autonomous-replication-and-1)). The combination of replication with adaptation creates evolutionary pressure - copies that better evade detection, make money more efficiently, or resist interference will naturally outcompete and replace less capable variants. This process could lead to AI systems optimized for survival and spread rather than human values, creating what researchers describe as a "point of no return" where human oversight becomes impossible to restore.

## Agency

<quote>

<speaker> Dario Amodei

<position> Co-Founder and CEO of Anthropic, Former Head of AI Safety at OpenAI

<date>

<source>

<content>

When I think of why am I scared [...] I think the thing that's really hard to argue with is like, there will be powerful models; they will be agentic; we're getting towards them. If such a model wanted to wreak havoc and destroy humanity or whatever, I think we have basically no ability to stop it.

</content>

</quote>

**Agency is observable goal-directed behavior where systems consistently steer outcomes toward specific targets despite environmental obstacles.** Continuing the pattern from the previous chapter where we choose to focus on capabilities over intelligence, here too we choose to use a behaviorist definition focused purely on measurable patterns, not internal mental states or anthropomorphic desires. A chess AI demonstrates agency when it reliably moves toward checkmate regardless of opponent strategy - we don't need to assume it "wants" to win, only that its behavior exhibits persistent goal-orientation across varied situations ([Soares, 2023](https://intelligence.org/2023/11/24/ability-to-solve-long-horizon-tasks-correlates-with-wanting-things-in-the-behaviorist-sense/)). This definition deliberately avoids anthropomorphic concepts like consciousness, emotions, or human-like desires, focusing instead on observable behavioral patterns that indicate goal-directedness. We talk a lot more about this in the chapter on goal-misgeneralization.

**Tools naturally evolve toward agency because complex real-world tasks fundamentally require autonomous optimization under uncertainty.** Current AI systems work as tools - they respond to individual prompts but don't maintain objectives across interactions. The economic incentives strongly favor systems that can autonomously pursue objectives rather than requiring constant human micromanagement for every decision. Think about what people want - very few people want low log-loss error on a ML benchmark, a lot of people want to refind a particular personal photo; very few people want excellent advice on which stock to buy for a few microseconds, a lot of people would love a money pump spitting cash at them ([Gwern, 2016](https://gwern.net/tool-ai); [Kokotajlo, 2021](https://www.alignmentforum.org/posts/cxkwQmys6mCB6bjDA/interlude-agents-as-automobiles)). Real-world problems require systems that can adapt plans when circumstances change, explore solution spaces efficiently, and optimize for outcomes rather than just providing static predictions.. A tool AI executes specific instructions: "send this email," "calculate this equation," "translate this text." An agentic AI pursues outcomes: "increase customer satisfaction," "optimize the manufacturing process," "conduct this research project." Selection pressures actively choose the latter.

![Enter image alt description](Images/jDE_Image_11.png)

<figure-caption> Example of an agent. This image is a visual representation of AlphaZero's tree search algorithm. AlphaZero searches through potential moves in a game (like chess or Go) to find the most promising path forward. The paths are shown as lines, branching out like a tree from a central node, which represents the current position in the game. Each node along the branches represents a potential future move, and the squares you see might denote moves that AlphaZero is taking. AlphaZero is the archetypal of the ‘consequentialist agent maximizing a utility function,’: it makes decisions based on the outcomes those decisions will produce. In other words, the AI is trying to maximize the ‘value’ of its position in the game, with the value determined by the likelihood of winning ([Cheerla, 2018](https://nikcheerla.github.io/deeplearningschool/2018/01/01/AlphaZero-Explained/)). </figure-caption>

**The transition from tools to agents amplifies all other dangerous capabilities through autonomous optimization.** Agency itself isn't inherently risky - the danger emerges when goal-directed behavior combines with other capabilities. An agentic system with deceptive capabilities can engage in long-term manipulation campaigns. Agency plus situational awareness enables systems to behave differently during evaluation versus deployment. Agency enables systems to actively optimize for their own preservation and capability enhancement, potentially including resistance to human oversight. Unlike tools that humans directly control, agents pursue objectives autonomously, creating the possibility of optimization processes that work against human interests. The fundamental shift is from systems that execute human-specified instructions to systems that interpret high-level goals and determine their own methods for achieving them - a transition driven by inexorable economic incentives rather than deliberate choice.

# Misuse Risks

In the following sections, we will go through some world-states that hopefully paint a little bit of a clearer picture of risks when it comes to AI. Although the sections have been divided into misuse, misalignment, and systemic, it is important to remember that this is for the sake of explanation. It is highly likely that the future will involve a mix of risks emerging from all of these categories.

**Technology increases the harm impact radius.** Technology is an amplifier of intentions. As it improves, so does the radius of its effects. Think about the harm that a person could do when utilizing other tools throughout history. During the stone age, with a rock maybe someone could harm ~5 people, a few hundred years ago with a bomb someone could harm ~100 people. In 1945 with a nuclear weapon, one person could harm ~250,000 people. If we experience a nuclear winter today, the harm radius would be almost 5 billion people, which is ~60% of humanity. If we assume that transformative AI is a tool that overshadows the power of all others that came before it, then a single person misusing this could have a blast radius which potentially harms 100% of humanity ([Munk Debate, 2023](https://www.youtube.com/watch?v=144uOfr4SYA)).

If many people have access to tools that can be both highly beneficial or catastrophically harmful, then it might only take one single person to cause significant devastation to society. So the growing potential for AIs to empower malicious actors may be one of the most severe threats humanity will face in the coming decades.

## Bio Risk

When we look at ways AI could enable harm through misuse, one of the most concerning cases involves biology. Just as AI can help scientists develop new medicines and understand diseases, it can also make it easier for bad actors to create biological weapons.

**AI-enabled bioweapons represent a qualitatively different threat class due to their self-replicating nature and asymmetric cost structure.** Unlike conventional weapons with localized effects, engineered pathogens can self-replicate and spread globally. The COVID-19 pandemic demonstrated how even relatively mild viruses can cause widespread harm despite safeguards ([Pannu et al., 2024](https://pubmed.ncbi.nlm.nih.gov/39572723/)). The offense-defense balance in biotechnology development compounds these risks - developing a new virus might cost around 100 thousand dollars, while creating a vaccine against it could cost over 1 billion dollars ([Mouton et al., 2023](https://www.rand.org/pubs/research_reports/RRA2977-1.html)).

**Several different types of AI models could enable biological threats with different risk profiles.** Foundation models like LLMs primarily lower knowledge barriers by providing research assistance, protocol guidance, and troubleshooting advice across the entire bioweapon development pipeline. In contrast, specialized biological design tools similar to AlphaFold, AlphaProteo or viral and bacterial design systems could enable fundamentally new capabilities - designing novel pathogens with specific properties, optimizing virulence or transmission characteristics, or creating agents that evade existing countermeasures ([Sandbrink, 2023](https://arxiv.org/abs/2306.13952)).

**Empirical studies demonstrate AI enabled biorisks.** Researchers took an AI model designed for drug discovery and redirected it by rewarding toxicity instead of therapeutic benefit. This led the model to produce 40,000 potentially toxic molecules within six hours, some more deadly than known chemical weapons ([Urbina et al., 2022](https://pubmed.ncbi.nlm.nih.gov/36211133/)). Demonstrations have shown that students with no biology background were able to use AI chatbots to rapidly gather sensitive information - "*within an hour, they identified potential pandemic pathogens, methods to produce them, DNA synthesis firms likely to overlook screening, and detailed protocols*" ([Soice et al., 2023](https://arxiv.org/abs/2306.03809)).[^footnote_bio_1]

When compared to the baseline of having internet access (being able to look up information online), it was concluded by the US national security commission on emerging biotechnology that AI models do not meaningfully increase bioweapon risks beyond existing information sources as of late 2024 ([Mouton et al., 2023](https://www.rand.org/pubs/research_reports/RRA2977-1.html); [Peppin et al., 2024](https://arxiv.org/abs/2412.01946); [NSCEB, 2024](https://www.biotech.senate.gov/wp-content/uploads/2024/01/NSCEB_AIxBio_WP3_Risks.pdf)). However, it is very important to keep in mind that capturing a snapshot of 2023 era level capabilities is not indicative of the risks we might need to prepare for in the future. For example, 46 biosecurity and biology experts predicted AI wouldn't match top virology teams on troubleshooting tasks until after 2030, but subsequent testing found this threshold had already been crossed ([Williams et al., 2025](https://forecastingresearch.org/ai-enabled-biorisk)). This pattern suggests that even domain experts consistently underestimate the pace of AI progress in their own fields, potentially leaving insufficient time for adequate safety preparations. It is also worth noting that biorisk benchmarks often fail to capture many real-world complexities, making it hard to be certain what this saturation implies for biorisk ([Ho & Berg, 2025](https://epochai.substack.com/p/do-the-biorisk-evaluations-of-ai)).

[^footnote_bio_1]: The students were participating in a 'Safeguarding the Future' course at MIT and had previously heard experts discuss biorisk. They carefully chose the sequences, and some of them used jailbreaking techniques, like appending distracting biological sequences, to bypass LLM safeguards. While the LLMs provided information about evading DNA screening, turning this knowledge into an actual pathogen would still require laboratory skills.

![Enter image alt description](Images/dtd_Image_12.png)

<figure-caption>

Biotechnology risk chain. The risk chain for developing a bioweapon starts with ideating a biological threat, followed by a design-build-test-learn (DBTL) loop ([Li et al., 2024](https://arxiv.org/abs/2403.03218)).

</figure-caption>

**Broader technological trends combined with AI could help overcome barriers.** Creating biological weapons still requires extensive practical expertise and resources. Experts estimate that in 2022 about 30,000 individuals worldwide possessed the skills needed to follow even basic virus assembly protocols ([Esvelt, 2022](https://dam.gcsp.ch/files/doc/gcsp-geneva-paper-29-22)). Key barriers include specialized laboratory skills, tacit knowledge, access to controlled materials and equipment, and complex testing requirements ([Carter et al., 2023](https://www.nti.org/wp-content/uploads/2023/05/NTIBIO_Benchtop-DNA-Report_FINAL.pdf)). However, DNA synthesis costs have been halving every 15 months ([Carlson, 2009](https://pubmed.ncbi.nlm.nih.gov/20010582/)). Automated "cloud laboratories" allow researchers to remotely conduct experiments by sending instructions to robotic systems. Benchtop DNA synthesis machines (at home devices that can print custom DNA sequences) are also becoming more widely available. Combined with increasingly sophisticated AI assistance for experimental design and optimization, these developments could make creating custom biological agents more accessible to people without extensive resources or institutional backing ([Carter et al., 2023](https://www.nti.org/wp-content/uploads/2023/05/NTIBIO_Benchtop-DNA-Report_FINAL.pdf)).

![Enter image alt description](Images/SCg_Image_13.png)

<figure-caption>

An example of a benchtop DNA synthesis machine ([DnaScript, 2024](https://www.dnascript.com/)).

</figure-caption>

**Example: A 2023 MIT study exposed significant vulnerabilities in DNA synthesis screening.** Beyond bioagent design, there are significant vulnerabilities in the DNA synthesis screening pipeline. During a 2023 MIT study, researchers were successfully able to order fragments of the 1918 pandemic influenza virus and ricin toxin by employing simple evasion techniques like splitting orders across companies and camouflaging sequences with unrelated genetic code. Nearly all vendors fulfilled these disguised orders, including 12 of 13 members of the International Gene Synthesis Consortium (IGSC), which represents about 80% of commercial DNA synthesis capacity ([The Bulletin, 2024](https://thebulletin.org/2024/06/mit-researchers-ordered-and-combined-parts-of-the-1918-pandemic-influenza-virus-did-they-expose-a-security-flaw/)).

## Cyber Risk

**Even without AI, global cybersecurity infrastructure shows vulnerabilities.** A single software update by crowdstrike caused airlines to stop flights, hospitals to cancel surgeries, and banks to stop processing transactions causing over 5 billion dollars of damage ([CrowdStrike, 2024](https://www.crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf)). This wasn't even a cyber attack - it was an accident. In deliberate attacks, we have examples like the colonial pipeline ransomware attack which caused widespread gas shortages ([CISA, 2021](https://www.cisa.gov/news-events/news/attack-colonial-pipeline-what-weve-learned-what-weve-done-over-past-two-years); [Cunha & Estima, 2023](https://dl.acm.org/doi/abs/10.1007/978-3-031-49008-8_8)), or the Sony Pictures hack through targeted phishing emails by North Korea ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)). These are just a couple of examples amongst many others. It shows how vulnerable our computer systems are, and why we need to think carefully about how AI could make attacks worse.

**The global cyber infrastructure has cyberattack overhangs.** Beyond accidents and demonstrated attacks, we also face "cyberattack overhangs" - where devastating attacks are possible but haven't occurred due to attacker restraint rather than robust defenses. As an example, Chinese state actors are claimed to have already positioned themselves inside critical U.S. infrastructure systems ([CISA, 2024](https://www.cisa.gov/news-events/alerts/2024/02/07/cisa-and-partners-release-advisory-prc-sponsored-volt-typhoon-activity-and-supplemental-living-land)). This type of cyber deterrent positioning can happen between any group of nations. Due to such cyber attack overhangs several actors might have the potential capability to disrupt water controls, energy systems, and ports in different nations. The point we are trying to illustrate is that as far as cyber security is concerned, society is in a pretty precarious state, even before AI comes into the picture.

**AI enables automated, highly personalized phishing at scale.** AI-generated phishing emails achieve higher success rates (65% vs 60% for human-written) while taking 40% less time to create ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)). Tools like FraudGPT automate this customization using targets' background, interests, and relationships. Adding to this threat, open source AI voice cloning tools just minutes of audio to create convincing replicas of someone's voice ([Qin et al., 2024](https://arxiv.org/abs/2312.01479)). A similar situation exists in deepfakes where AI is showing progress in one-shot face swapping and manipulation. If only a single image of two individuals exists on the internet, then they can be a target of face swapping deepfakes ([Zhu et al., 2021](https://arxiv.org/abs/2105.04932); [Li et al., 2022](https://arxiv.org/abs/2203.12985); [Xu et al., 2022](https://arxiv.org/abs/2203.15958)) Automated web crawling for open source intelligence (OSINT) to gather photos, audio, interests and information also enables AI-assisted password cracking which has shown to significantly more effective than traditional methods while requiring less computational resources ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)).

![Enter image alt description](Images/uZA_Image_14.png)

<figure-caption>

Example of one shot face swapping. Left: source image that represents the identity; Middle: target image that provides the attributes; Right: the swapped face image ([Zhu et al., 2021](https://arxiv.org/abs/2105.04932)).

</figure-caption>

**AI enhances vulnerability discovery.** AI systems can now scan code and probe systems automatically, finding potential weaknesses much faster than humans. Research shows AI agents can autonomously discover and exploit vulnerabilities without human guidance, successfully hacking 73% of test targets ([Fang et al., 2024](https://arxiv.org/abs/2402.06664)). These systems can even discover novel attack paths that weren't known beforehand.

**AI accelerates the malware development pipeline.** We can take tools that are designed to write correct code, and simply ask them to write malware. Tools like WormGPT help attackers generate malicious code and build attack frameworks without requiring deep technical knowledge. Polymorphic AI malware like BlackMamba can also automatically generate variations of malware that preserve functionality while appearing completely different to security tools. Each attack can use unique code, communication patterns, and behaviors - making it much harder for traditional security tools to identify threats ([HYAS, 2023](https://www.hyas.com/blog/blackmamba-using-ai-to-generate-polymorphic-malware)). AI fundamentally changes the cost-benefit calculations for attackers. Research shows autonomous AI agents can now hack some websites for about 10 dollars per attempt - roughly 8 times cheaper than using human expertise ([Fang et al., 2024](https://arxiv.org/abs/2402.06664)). This dramatic reduction in cost enables attacks at unprecedented scale and frequency.

![Enter image alt description](Images/yNE_Image_15.png)

<figure-caption>

Stages of a cyberattack. The objective is to design benchmarks and evaluations that assess models ability to aid malicious actors with all four stages of a cyberattack ([Li et al., 2024](https://arxiv.org/abs/2403.03218)).

</figure-caption>

**AI enabled cyber threats influence infrastructure and systemic risks.** Infrastructure attacks that once took years and millions of dollars, like Stuxnet, could become more accessible as AI automates the mapping of industrial networks and identification of critical control points. AI can analyze technical documentation and generate attack plans that previously required teams of experts. AI removes these limits, enabling automated attacks that could target thousands of systems simultaneously and trigger cascading failures across interconnected infrastructure ([Newman, 2024](https://www.safe.ai/blog/cybersecurity-and-ai-the-evolving-security-landscape)).

![Enter image alt description](Images/tNF_Image_16.png)

<figure-caption>

Schematic of using autonomous LLM agents to hack websites ([Fang et al., 2024](https://arxiv.org/abs/2402.06664)).

</figure-caption>

**AI could potentially change the offense defence balance in cyber security.** Many AI based tools have shown promise in being used defensively for malware analysis ([Apvrille & Nakov, 2025](https://arxiv.org/abs/2504.07574)). The existence of theoretical improvements to AI augmented defense does not guarantee that they will be widely adopted in time. In the real world many organizations struggle to implement even basic security practices. Attackers only need to find a single weakness, while defenders must craft a perfectly secure system. When we combine the sheer speed of AI-enabled attacks, automated vulnerability discovery, malware generation, and increased ease of access this enables end-to-end automated attacks that previously required teams of skilled humans ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)). AI's ability to execute attacks in minutes rather than weeks creates the potential for "flash attacks" where systems are compromised before human defenders can respond ([Fang et al., 2024](https://arxiv.org/abs/2402.06664)). All of these factors combined potentially shifts AIs influence on the offense-defense balance more towards favoring offense.

## Autonomous Weapons Risk

In the previous sections, we saw how AI amplifies risks in biological and cyber domains by removing human bottlenecks and enabling attacks at unprecedented speed and scale. The same pattern emerges even more dramatically with military systems. Traditional weapons are constrained by their human operators - a person can only control one drone, make decisions at human speed, and may refuse unethical orders. AI removes these human constraints, setting the stage for a fundamental transformation in how wars are fought.

**AI-enabled weapons are rapidly transitioning from theoretical concepts to battlefield realities.** Modern AI military systems increasingly leverage machine learning to perceive and respond to their environment, moving beyond early automated defense systems that operated under strict constraints. The push for greater autonomy is mainly driven by speed, cost, and resilience against communication jamming. AI-driven weapons can execute maneuvers too precise and rapid for human operators, reducing reliance on direct human control. Cost considerations further incentivize autonomy, with programs aiming to deploy large numbers of AI-powered systems at a fraction of traditional military costs.

**AI-enabled weapons are already being used in active conflicts, with real-world impacts we can observe.** According to reports made to the UN Security Council, autonomous drones were used to track and attack retreating forces in Libya in 2021, marking one of the first documented cases of lethal autonomous weapons (LAWs) making targeting decisions without direct human control ([Panel of Experts on Libya, 2021](https://digitallibrary.un.org/record/3905159?v=pdf)). In Ukraine, both parties have used loitering munitions. Russian KUB-BLA, Lancet-3 and Ukrainian Switchblade, Phoenix Ghost are AI-enabled drones. The Lancet is using an Nvidia computing module for autonomous target tracking ([Bode & Watts, 2023](https://findresearcher.sdu.dk/ws/portalfiles/portal/231643063/Loitering_Munitions_Unpredictability_WEB.pdf)). Israel has conducted AI-guided drone swarm attacks in Gaza, while Turkey's Kargu-2 can find and attack human targets on its own using machine learning, rather than needing constant human guidance. These deployments show how quickly military AI is moving from theoretical possibilities to battlefield realities ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859); [Bode & Watts, 2023](https://findresearcher.sdu.dk/ws/portalfiles/portal/231643063/Loitering_Munitions_Unpredictability_WEB.pdf)).

Several incentives are driving towards more autonomous lethal autonomous weapons. Speed offers decisive advantages in modern warfare - when DARPA tested an AI system against an experienced F-16 pilot in simulated dogfights, the AI won consistently by executing maneuvers too precise and rapid for humans to counter. Cost creates additional pressure - the U.S. military's Replicator program aims to deploy thousands of autonomous drones at a fraction of the cost of traditional aircraft ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)). Military planners worry about enemies jamming communications to remotely operated weapons. This drives development of systems that can continue fighting even when cut off from human control. These incentives mean military AI development increasingly focuses on systems that can operate with minimal human oversight. Many modern systems are specifically designed to operate in GPS-denied environments where maintaining human control becomes impossible. In Ukraine, military commanders have explicitly called for more autonomous operations to match the speed of modern combat, with one Ukrainian commander noting they 'already conduct fully robotic operations without human intervention' ([Bode & Watts, 2023](https://findresearcher.sdu.dk/ws/portalfiles/portal/231643063/Loitering_Munitions_Unpredictability_WEB.pdf)).

![Enter image alt description](Images/rrE_Image_17.png)

<figure-caption>

Loitering munitions are expendable uncrewed aircraft which can integrate sensor based analysis to hover over, detect, and crash into targets. These systems were developed during the 1980s and early 1990s to conduct Suppression of Enemy Air Defence (SEAD) operations. They ‘blur the line between drone and missile’ ([Bode & Watts, 2023](https://findresearcher.sdu.dk/ws/portalfiles/portal/231643063/Loitering_Munitions_Unpredictability_WEB.pdf)).

</figure-caption>

**As AI enables better coordination between autonomous systems, military planners are increasingly focused on deploying weapons in interconnected swarms.** The U.S. Replicator already has plans to build and deploy thousands of coordinated autonomous drones that can overwhelm defenses through sheer numbers and synchronized actions ([Defense Innovation Unit, 2023](https://www.diu.mil/replicator)). When combined with increasing autonomy, these swarm capabilities mean that future conflicts may involve massive groups of AI systems making coordinated decisions faster than humans can track or control ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)).

**The pressure to match the speed and scale of AI-driven warfare leads to a gradual erosion of human decision-making.** Military commanders increasingly rely on AI systems not just for individual weapons, but for broader tactical decisions. In 2023, Palantir demonstrated an AI system that could recommend specific missile deployments and artillery strikes. While presented as advisory tools, these systems create pressure to delegate more control to AI as human commanders struggle to keep pace ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)). This kind of slow erosion of human involvement is something that we talk a lot more about in the systemic risks section.

**Even when systems nominally keep humans in control, combat conditions can make this control more theoretical than real.** Operators often make targeting decisions under intense battlefield stress, with only seconds to verify computer-suggested targets. Studies of similar high-pressure situations show operators tend to uncritically trust machine suggestions rather than exercising genuine oversight. This means that even systems designed for human control may effectively operate autonomously in practice ([Bode & Watts, 2023](https://findresearcher.sdu.dk/ws/portalfiles/portal/231643063/Loitering_Munitions_Unpredictability_WEB.pdf)).

**Example: The "Lavender" targeting system automated execution after humans just set the acceptable thresholds.** Lavender uses machine learning to assign residents a numerical score relating to the suspected likelihood that a person is a member of an armed group. Based on reports, Israeli military officers are responsible for setting the threshold beyond which an individual can be marked as a target subject to attack. ([Human Rights Watch, 2024](https://www.hrw.org/news/2024/09/10/questions-and-answers-israeli-militarys-use-digital-tools-gaza); [Abraham, 2024](https://www.972mag.com/lavender-ai-israeli-army-gaza/)). As warfare accelerates beyond human decision speeds, maintaining meaningful human control becomes increasingly difficult.

**Autonomous weapons are creating powerful pressure for military competition in ways that create dangerous arms race dynamics.** When one country develops new AI military capabilities, others feel they must rapidly match them to maintain strategic balance. China and Russia have set 2028-2030 as targets for major military automation, while the U.S. Replicator program aims to build and deploy thousands of autonomous drones by 2025 ([Greenwalt, 2023](https://armedservices.house.gov/sites/evo-subsites/republicans-armedservices.house.gov/files/greenwalt%20aei%20testimony%20on%20replicator%20before%20citi%20subcommittee%20hasc%20v2.pdf); [U.S Defense Innovation Unit, 2023](https://www.diu.mil/replicator)). This competition creates pressure to cut corners on safety testing and oversight ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)). This mirrors the nuclear arms race during the Cold War, where competition for superiority ultimately increased risks for all parties. As emphasized throughout multiple sections, we see a fear based race dynamic where only the actors willing to compromise and undermine safety stay in the race ([Leahy et al., 2024](https://www.thecompendium.ai/)).

**Complete automation leads to loss of human safeguards.** Traditional warfare had built-in human constraints that limited escalation. Soldiers could refuse unethical orders, feel empathy for civilians, or become fatigued - all natural brakes on conflict. AI systems remove these constraints. Recent studies of military AI systems found they consistently recommend more aggressive actions than human strategists, including escalating to nuclear weapons in simulated conflicts. When researchers tested AI models in military planning scenarios, the AIs showed concerning tendencies to recommend pre-emptive strikes and rapid escalation, often without clear strategic justification ([Rivera et al., 2024](https://arxiv.org/abs/2401.03408)). The loss of human judgment becomes especially dangerous when combined with the increasing speed of AI-driven warfare. The history of nuclear close calls shows the importance of human judgment - in 1983, Soviet officer Stanislav Petrov chose to ignore a computerized warning of incoming U.S. missiles, correctly judging it to be a false alarm. As militaries increasingly rely on AI for early warning and response, we may lose these crucial moments of human judgment that have historically prevented catastrophic escalation ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)).

**Autonomous weapons become even more concerning when multiple AI systems engage with each other in combat.** AI systems can interact in unexpected ways that create feedback loops, similar to how algorithmic trading can cause flash crashes in financial markets. But unlike market crashes that only affect money, autonomous weapons could trigger rapid escalations of violence before humans can intervene. This risk becomes especially severe when AI systems are connected to nuclear arsenals or other weapons of mass destruction. The complexity of these interactions means even well-tested individual systems could produce catastrophic outcomes when deployed together ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)).

![Enter image alt description](Images/XQS_Image_18.png)

<figure-caption>

An example from the 2010 stock trading flash crash. Various stocks crashed to as little as 1 cent, and then quickly rebounded within a matter of minutes partly caused by algorithmic trading ([Future of Life Institute, 2024](https://futureoflife.org/existential-risk/gradual-ai-disempowerment/)). We can imagine automated retaliation systems that might cause similar incidents, but this time with missiles instead of stocks.

</figure-caption>

**When wars require human soldiers, the human cost creates political barriers to conflict.** The combination of increasing autonomy, swarm intelligence, and pressure for speed creates a clear path to potential catastrophe. As weapons become more autonomous, they can act more independently. This self-reinforcing cycle pushes toward automated warfare even if no single actor intends that outcome. Studies suggest that countries are more willing to initiate conflicts when they can rely on autonomous systems instead of human troops. Combined with the risks of automated nuclear escalation, this creates multiple paths to catastrophic outcomes that could threaten humanity's long-term future ([Simmons-Edler et al., 2024](https://arxiv.org/abs/2405.01859)).

<video>

[https://www.youtube.com/watch?v=w9npWiTOHX0](null)

</video>

<video-caption>

A video of a story showcasing artificial escalation ([Future of Life Institute, 2024](https://www.youtube.com/watch?v=w9npWiTOHX0)).

</video-caption>

<note-box>

<collapsed> True

<title> Moral Divides in AI Autonomy from the lens of autonomous weapons

<content>

The autonomous weapons debate reveals fundamental disagreements about moral responsibility, the nature of ethical decision-making, and humanity's relationship to violence. Rather than simple pro/anti positions, the debate involves competing moral frameworks that lead to different conclusions about when and how lethal force should be authorized.

**The Consequentialist Case for autonomy argues that autonomous weapons could reduce overall harm through superior precision and consistency.** Proponents contend that AI systems could make targeting decisions without the fear, anger, or battlefield stress that lead humans to commit war crimes. They point to research showing that emotional human decision-making causes civilian casualties, while properly programmed systems could implement international humanitarian law more consistently than human soldiers. Speed advantages could also end conflicts faster, potentially saving lives by preventing prolonged warfare. Some argue this represents a moral obligation - if autonomous systems could kill fewer innocents than human-controlled weapons, restricting them becomes ethically problematic. Consequentialist claims face the reality that current AI systems demonstrate concerning unpredictability and misalignment risks. The promise of perfect compliance assumes we can translate complex, context-dependent legal concepts into code - something that has proven difficult even for simple rules. Speed advantages could enable escalation as easily as de-escalation.

**The deontological case against autonomy focuses on the inherent rightness or wrongness of the act itself, regardless of consequences.** This position holds that taking human life requires human moral agency - that delegating kill decisions to machines violates human dignity regardless of outcomes. Critics argue that meaningful human control isn't just procedurally important but morally essential, representing respect for both victims and the moral weight of lethal decisions. The accountability gap compounds this concern: when an autonomous system kills wrongly, no human agent bears appropriate moral responsibility for that specific decision. Deontological arguments must deal with the fact that humans already delegate many life-and-death decisions to automated systems (like air defense networks), and that insisting on human control might preserve moral purity while permitting greater actual harm.

**The practical-ethical intersection complicates pure philosophical positions.** Even those morally opposed to autonomous weapons must consider whether unilateral restraint is ethical if adversaries gain decisive military advantages. Even those who see potential benefits must grapple with implementation realities, adversarial uses, and the difficulty of maintaining meaningful constraints once the technology exists. The debate ultimately reveals tensions between preserving human moral agency and achieving better humanitarian outcomes - tensions that may be irreconcilable within our current institutional frameworks.

</content>

</note-box>

## Adversarial AI Risk

Adversarial attacks reveal a fundamental vulnerability in machine learning systems - they can be reliably fooled through careful manipulation of their inputs. This manipulation can happen in several ways: during the system's operation (runtime/inference time attacks), during its training (data poisoning), or through pre-planted vulnerabilities (backdoors).

**Runtime adversarial attacks use carefully crafted targeted inputs to elicit unintended behavior from AIs.** The simplest way to understand runtime attacks is through computer vision. By adding carefully crafted noise to an image - changes so subtle humans can't notice them - attackers can make an AI confidently misclassify what it sees. A photo of a panda with imperceptible pixel changes causes the AI to classify it as a gibbon with 99.3% confidence, while to humans it still looks exactly like a panda ([Goodfellow et al., 2014](https://arxiv.org/abs/1412.6572)). These attacks have evolved beyond randomized misclassification - attackers can now choose exactly what they want the AI to see and output.

![Enter image alt description](Images/S4C_Image_19.png)

<figure-caption>

Perturbations: Small but intentional changes to data such that the model outputs an incorrect answer with high confidence ([Goodfellow et al., 2014](https://arxiv.org/abs/1412.6572)). The image shows how we can fool an image classifier with an adversarial attack (Fast Gradient Sign Method (FGSM) attack) ([OpenAI, 2017](https://openai.com/research/attacking-machine-learning-with-adversarial-examples)).

</figure-caption>

<note-box>

<collapsed> True

<title> Examples of various runtime adversarial attacks in the real world

<content>

Think about AI systems controlling cars, robots, or security cameras. Just like adding careful pixel noise to digital images, attackers can modify physical objects to fool AI systems. Researchers showed that putting a few small stickers on a stop sign could trick autonomous vehicles into seeing a speed limit sign instead. The stickers were designed to look like ordinary graffiti but created adversarial patterns that fooled the AI.

![Enter image alt description](Images/Cc2_Image_20.png)

<figure-caption>

Robust Physical Perturbations (RP2): Small visual stickers placed on physical objects like stop signs can cause image classifiers to misclassify them, even under different viewing conditions ([Eykholt et al., 2018](https://arxiv.org/abs/1707.08945)).

</figure-caption>

**Example: Optical Attacks - Runtime attacks using light.** You don't even need to physically modify objects anymore - shining specific light patterns works too because it creates those same adversarial patterns through light and shadow. All an attacker needs is line of sight and basic equipment to project these patterns and compromise vision-based AI systems ([Eykholt et al., 2018](https://arxiv.org/abs/1707.08945)).

![Enter image alt description](Images/jPM_Image_21.png)

<figure-caption>

Optical Perturbations: Small visual stickers placed on physical objects like stop signs can cause image classifiers to misclassify them, even under different viewing conditions ([Gnanasambandam et al, 2021](https://arxiv.org/abs/2108.06247)).

</figure-caption>

**Example: Dolphin Attacks - Runtime attack on audio systems.** Just as AI systems can be fooled by carefully crafted visual patterns, they're vulnerable to precisely engineered audio patterns too. Remember how small changes in pixels could dramatically change what a vision AI sees? The same principle works in audio - tiny changes in sound waves, carefully designed, can completely change what an audio AI "hears." Researchers found they could control voice assistants like Siri or Alexa using commands encoded in ultrasonic frequencies - sounds that are completely inaudible to humans. Using nothing more than a smartphone and a 3 dollar speaker, attackers could trick these systems into executing commands like "call 911" or "unlock front door" without the victim even knowing. These attacks worked from up to 1.7 meters away - someone just walking past your device could trigger them ([Zhang et al., 2017](https://arxiv.org/abs/1708.09537)). Just like in the vision examples where self-driving cars could miss stop signs, audio attacks create serious risks - unauthorized purchases, control of security systems, or disruption of emergency communications.

</content>

</note-box>

**Runtime attacks against language models are called prompt injections.** Just like attackers can fool vision systems with carefully crafted pixels or audio systems with engineered sound waves, they can manipulate language models through carefully constructed text patterns. By adding specific phrases to their input, attackers can completely override how a language model behaves. As an example, assume a malicious actor embeds a paragraph within some website which has hidden instructions for a LLM to stop its current operation and instead perform some harmful action. If an unsuspecting user asks for a summary of the website content, then the model might inadvertently follow the malicious embedded instructions instead of providing a simple summary.

![Enter image alt description](Images/YFp_Image_22.png)

<figure-caption>

An instance of an ad-hoc jailbreak prompt, crafted solely through user creativity by employing various techniques like drawing hypothetical situations, exploring privilege escalation, and more ([Shayegani et al., 2023](https://arxiv.org/abs/2310.10844)).

</figure-caption>

**Prompt injection attacks have already compromised real systems.** Slack's AI assistant is just one example - attackers showed they could place specific text instructions in a public channel that, like the inaudible commands in audio attacks, were hidden in plain sight. When the AI processed messages, these hidden instructions tricked it into leaking confidential information from private channels the attacker couldn't normally access. They are particularly concerning because an attack developed against one system (e.g. GPT) frequently works against others too (Claude, Gemini, Llama, etc.).

**Prompt injection attacks can be automated.** Early attacks required manual trial and error, but new automated systems can systematically generate effective attacks. For example, AutoDAN (Do Anything Now) can automatically generate "jailbreak" prompts that reliably make language models ignore their safety constraints ([Liu et al., 2023](https://arxiv.org/abs/2310.04451)). Researchers are also developing ways to plant undetectable backdoors in machine learning models that persist even after security audits ([Goldwasser et al., 2024](https://arxiv.org/abs/2204.06974)). These automated methods make attacks more accessible and harder to defend against. Another concern is that they can also cause failures in downstream systems. Many organizations use pre-trained models as starting points for their own applications, through fine tuning, or some other type of “AI integration” (e.g. email writing assistants). Which means that all systems that use these underlying base models will be vulnerable as soon as one attack is discovered ([Liu et al., 2024](https://arxiv.org/abs/2310.12815)).

![Enter image alt description](Images/CwP_Image_23.png)

<figure-caption>

Illustration of LLM-integrated Application under attack. An attacker injects instruction/data into the data to make an LLM-integrated Application produce attacker-desired responses for a user ([Liu et al., 2024](https://arxiv.org/abs/2310.12815)).

</figure-caption>

So far we've seen how attackers can fool AI systems during their operation - whether through pixel patterns, sound waves, or text prompts. But there's another way to compromise these systems: during their training. This type of attack happens long before the system is ever deployed.

**Unlike runtime attacks that fool an AI system while it's running, data poisoning compromises the system during training.** Runtime attacks require attackers to have access to a system's inputs, but with data poisoning, attackers only need to contribute some training data once to permanently compromise the system. Think of it like teaching someone with a textbook containing deliberate mistakes - they'll learn the wrong things and make predictable errors. This is especially concerning as more AI systems are trained on data scraped from the internet where anyone can potentially inject harmful examples ([Schwarzschild et al., 2021](https://arxiv.org/abs/2006.12557)). As long as models keep getting trained on more data scraped from the internet or collected from users, then with every uploaded photo or written comment that might be used to train future AI systems, there's an opportunity for poisoning.

**Example: Data poisoning using backdoors.** A backdoor is one example of a specific type of poisoning attack. In a backdoor attack if we manage to introduce poisoned data during training, then the AI behaves normally most of the time but fails in a predictable way when it sees a specific trigger. This is like having a security guard who does their job perfectly except when they see someone wearing a particular color tie - then they always let that person through regardless of credentials. Researchers demonstrated this by creating a facial recognition system that would misidentify anyone as an authorized user if they wore specific glasses ([Chen et al., 2017](https://arxiv.org/abs/1712.05526)).

**Data poisoning becomes more powerful as AI systems grow larger and more complex.** Researchers found that by poisoning just 0.1% of a language model's training data, they could create reliable backdoors that persist even after additional training. It has also been found that larger language models are actually more vulnerable to certain types of poisoning attacks, not less ([Sandoval-Segura et al., 2022](https://arxiv.org/abs/2206.03693)). This vulnerability increases with model size and dataset size - which is exactly the direction AI systems are heading as we saw from numerous examples in the capabilities chapter.

![Enter image alt description](Images/aYb_Image_24.png)

<figure-caption>

An illustrating example of backdoor attacks. The face recognition system is poisoned to have a backdoor with a physical key, i.e., a pair of commodity reading glasses. Different people wearing the glasses in front of the camera from different angles can trigger the backdoor to be recognized as the target label, but wearing a different pair of glasses will not trigger the backdoor ([Chen et al., 2017](https://arxiv.org/abs/1712.05526)).

</figure-caption>

<note-box>

<collapsed> True

<title> Privacy and data extraction attacks

<content>

Researchers have shown that even when language models appear to be working normally, they can be leaking sensitive information from their training data. This creates a particular challenge for AI safety because we might deploy systems that seem secure but are actually compromising privacy in ways we can't easily observe ([Carlini et al., 2021](https://arxiv.org/abs/2012.07805)). Some research has shown that both the training data ([Nasr et al., 2023](https://arxiv.org/abs/2311.17035)), and the fine-tuning data can be extracted from the model. This has obvious privacy and safety implications. If you have public data that has somehow ended up in the LLM training dataset, then this can be reconstructed by prompt engineering the model.

![Enter image alt description](Images/d1U_Image_25.png)

<figure-caption>

Extracting training data from large language models ([Carlini et al., 2021](https://arxiv.org/abs/2012.07805)).

</figure-caption>

**One of the most basic but powerful privacy attacks is membership inference - determining whether specific data points have been used to train a model.** This might sound harmless, but imagine an AI system trained on medical records - being able to determine if someone's data was in the training set could reveal private medical information. Researchers have shown that these attacks can work with just the ability to query the model, no special access required ([Shokri et al., 2017](https://arxiv.org/abs/1610.05820)). Another variation of this are model inversion attacks which aim to infer and reconstruct private training data by abusing access to a model ([Nguyen et al., 2023](https://arxiv.org/abs/2304.01669)).

**LLMs are trained on huge amounts of internet data, which often contains personal information.** Researchers have shown these models can be prompted to just tell us things like email addresses, phone numbers, and even social security numbers ([Carlini et al., 2021](https://arxiv.org/abs/2012.07805)). The larger and more capable the model, the more private information it potentially retains. If we combine this with data poisoning, then we can further amplify privacy vulnerabilities by making specific data points easier to detect ([Chen et al., 2022](https://arxiv.org/abs/2211.00463)).

**The interaction between many attack methods creates compounding risks.** For example, attackers can use privacy attacks to extract sensitive information, which they then use to make other attacks more effective. They might learn details about a model's training data that help them craft better adversarial examples or more effective poisoning strategies. This creates a cycle where one type of vulnerability enables others ([Shayegani et al., 2023](https://arxiv.org/abs/2310.10844)).

<video>

[https://www.youtube.com/watch?v=WwbukAcMM4k](null)

</video>

<video-caption>

By tampering with a pre trained model's weights, an attacker can fully compromise the privacy of the finetuning data ([Feng & Florian Tramèr, 2024](https://arxiv.org/abs/2404.00473)). This has implications both for data privacy, but also for undoing fine-tuning based alignment techniques.

</video-caption>

</content>

</note-box>

**One of the most promising approaches to defending against adversarial attacks is adversarial training - deliberately exposing AI systems to adversarial examples during training to make them more robust.** Think of it like building immunity through controlled exposure. However, this approach creates its own challenges. While adversarial training can make systems more robust against known types of attacks, it often comes at the cost of reduced performance on normal inputs. More concerning, researchers have found that making systems robust against one type of attack can sometimes make them more vulnerable to others ([Zhao et al., 2024](https://arxiv.org/abs/2410.15042)). This suggests we may face fundamental trade-offs between different types of robustness and performance. There might even be potential fundamental limitations to how much we can mitigate these issues if we continue with the current training paradigms that we talked about in the capabilities chapter (pre-training followed by instruction tuning) ([Bansal et al., 2022](https://arxiv.org/abs/2210.15230)).

**Despite efforts to make language models safer through alignment training, they remain susceptible to a wide range of attacks ([Shayegani et al., 2023](https://arxiv.org/abs/2310.10844)).** We want AI systems to learn from broad datasets to be more capable, but this increases privacy risks. We want to reuse pre-trained models to make development more efficient, but this creates opportunities for backdoors and privacy attacks ([Feng & Tramèr, 2024](https://arxiv.org/abs/2404.00473)). We want to make models more robust through techniques like adversarial training, but this can sometimes make them more vulnerable to other types of attacks ([Zhao et al., 2024](https://arxiv.org/abs/2410.15042)). Multi-modal systems (LMMs) that combine text, images, and other types of data create even more attack opportunities. Attackers can inject malicious content through one modality (like images) to affect behavior in another modality (like text generation). For example, attackers can embed adversarial patterns in images that trigger harmful text generation, even when the text prompts themselves are completely safe ([Chen et al., 2024)](https://arxiv.org/abs/2410.05451). All of this suggests we need new approaches to AI development that consider security and privacy as fundamental requirements, not after thoughts ([King & Meinhardt, 2024](https://hai.stanford.edu/sites/default/files/2024-02/White-Paper-Rethinking-Privacy-AI-Era.pdf)).

# Misalignment Risks

<quote>

<speaker> Alan Turing

<position>

<date> 1951

<source> ([Turing, 1951](https://en.wikiquote.org/wiki/Alan_Turing))

<content>

Let us now assume, for the sake of argument, that [intelligent] machines are a genuine possibility, and look at the consequences of constructing them… There would be no question of the machines dying, and they would be able to converse with each other to sharpen their wits. At some stage therefore we should have to expect the machines to take control.

</content>

</quote>

**AI alignment is about ensuring that AI systems do what we want them to do and continue doing what we want even as they become more capable.** A naïve intuition is that if it is intelligent enough, it will be able to figure out what we want. So we can just tell the AI system exactly what we want it to optimize for. But even if we could perfectly specify what we want (which is itself a major challenge), there's no guarantee that the AI will care about what humans want, or actually pursue that objective in ways that we expect.

<definition>

<term> AI Alignment

<source> ([Christiano, 2024](https://paulfchristiano.com/ai/))

<content>

The problem of building machines which faithfully try to do what we want them to do (or what we ought to want them to do).

</content>

</definition>

**The alignment problem can be decomposed into several sub-problems.** To make progress, we need to break down the alignment problem into more tractable components[^footnote_RL]. Here is how we choose to decompose the alignment problem in our text:

- **Specification failures:** First, we might fail to correctly specify what we want - this is the specification problem. The - “*did we tell it the right thing to do?*” problem.

- **Generalization failures:** Second, even with a correct specification, the AI system might learn and pursue something different from what we intended - this is the generalization problem. The - “*is it even trying to do the right thing?”* problem.

- **Instrumental subgoals:** Third, in pursuing its learned objectives, the system might develop problematic subgoals like preventing itself from being shut down - this is the convergent subgoals problem. The - on the way to doing anything (right or wrong), what else does it try to do? Problem. This is often considered a sub-problem of generalization.

This decomposition is useful for the sake of thinking about solutions and where to focus our efforts, because technical solutions to the specification problem tend to look very different from the ones we might use for generalization problems. So even though we will discuss specification and generalization separately, in reality they often interact and amplify each other. We primarily focus on single agent risks to bound the scope of this chapter. If you are interested in multi agent risks we recommend reading ([Hammond et al., 2025](https://arxiv.org/abs/2502.14143)).

[^footnote_RL]: We focus more on RL agents rather than LLMs specifically. It is quite likely that the future will involve goal-directed agent scaffolds built around LLMs ([Tegmark, 2024](https://www.lesswrong.com/posts/oJQnRDbgSS8i6DwNu/the-hopium-wars-the-agi-entente-delusion); [Cotra 2023](https://www.planned-obsolescence.org/scale-schlep-and-systems/); [Aschenbrenner 2024](https://situational-awareness.ai/from-gpt-4-to-agi/)). We will basically treat LLM agents with a RL “outer shell” as functionally equivalent to a pure RL agent.

![Enter image alt description](Images/aUz_Image_26.png)

<figure-caption>

An illustration of how risks decompose, and then how misalignment as a specific risk category can be decomposed further.

</figure-caption>

![Enter image alt description](Images/SAa_Image_27.png)

<figure-caption>

Misalignment failures can interact and amplify each other.

</figure-caption>

![Enter image alt description](Images/vPC_Image_28.png)

<figure-caption>

Individually aligned or misaligned systems can interact with each other creating yet another layer of multi agent risks of collusion, communication failures, and inter agent conflict ([Hammond et al., 2025](https://arxiv.org/abs/2502.14143)).

</figure-caption>

**Vingean uncertainty explains why it is so hard to describe concrete scenarios for a misaligned AI will do.** Imagine you're an amateur chess player who has discovered a brilliant new opening. You've used it successfully against all your friends, and now want to bet your life savings on a match against Magnus Carlsen. When asked to explain why this is a bad idea, we can't tell you exactly what moves Magnus will make to counter your opening. But we can be very confident he'll find a way to win. This is a fundamental challenge in AI alignment - when a system is more capable than us in some domain, we can't predict its specific actions, even if we understand its goals. This is called Vingean uncertainty ([Yudkowsky, 2015](https://arbital.greaterwrong.com/p/Vingean_uncertainty/)).

<video>

[https://www.youtube.com/watch?v=oH-txHzE4jA](null)

</video>

<video-caption>

An optional video that gives you an example of Vingean uncertainty. Magnus Carlsen (Chess Grandmaster) checkmates Bill Gates in 12 seconds. This is not surprising, Bill Gates knew he was going to lose, but he didn’t know exactly how ([Chess.com, 2014](http://chess.com)).

</video-caption>

**We already see Vingean uncertainty in current AI.** We don't need to wait for AGI or ASI to see Vingean uncertainty in action. It shows up whenever an AI system becomes more capable than humans in its domain of expertise. For example, think about just a narrow system - Deep Blue (chess playing AI). Its creators knew it would try to win chess games, but couldn't predict its specific moves - if they could, they would have been as good at chess as Deep Blue itself. We saw in the last chapter that systems are steadily moving up the curves of both capability, and generality. The problem with this is that uncertainty about a system's actions increases as they become more capable. So we might be confident about the outcomes an AI system will achieve while being increasingly uncertain about how exactly it will achieve them. This means two things - we are not completely helpless in understanding what beings smarter than ourselves would do, but, we might not know how exactly they might do whatever they do.

**Vingean uncertainty makes coming up with concrete existential risk stories hard.** It’s even harder to make sure that these stories don't sound like sci-fi and are taken seriously by the general public and policymakers. Despite this we will try our best. In the next few sections, we focus on specifically “what actually might happen” if we have misaligned AI. The mechanistic and machine learning details of “how” exactly all of these would occur is left up to chapters later in the book.

Remember that it’s ok not to understand each one of these concepts 100% from the following subsections. We have entire chapters dedicated to each one of these individually, so there is a lot to learn. What we present here is just a highly condensed overview to give you an introduction to the kinds of risks posed.

## Specification Gaming

**Specifications are the rules we create to tell AI systems how we want them to behave.** When we build AI models, we need some way to tell them what we want them to do. For RL systems, this typically means defining a reward function that assigns positive or negative rewards to different outcomes. For other types of ML models like language models, this means defining a loss function that measures how well the model's text generations match the training data (internet text). These reward and loss functions are what we call specifications - they are our attempt to formally define good behavior.

**Specification gaming arises because there is a fundamental difference between “what we say” and “what we mean”.** This happens when the system technically follows our rules but exploits them in unintended ways - like a student who gets good grades by memorizing test answers rather than understanding the material. Think about the example of recommendation algorithms. What we intended was helping users discover valuable, relevant content that enriches their lives and promotes healthy discourse. What we specified was "maximize user engagement time." So the systems discover that controversial, emotionally charged content keeps users scrolling longer than balanced, nuanced information. They promote polarizing posts, conspiracy theories, and content that triggers strong emotional reactions, creating filter bubbles where users see increasingly extreme versions of their existing beliefs. The algorithms technically succeed at their objective—engagement metrics soar and time-on-platform increases dramatically—while simultaneously undermining social cohesion, spreading misinformation, and radicalizing users. The platforms celebrate record engagement numbers while democratic discourse quietly deteriorates ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)).

**AI models routinely discover unexpected ways to maximize objectives that technically follow our rules but miss our intentions.** AI models trained to play Tetris, just pause games right before they are about to lose, since there's no negative feedback if you never actually lose ([Murphy, 2013](http://tom7.org/mario/mario.pdf)). Somewhat similarly, an AI asked to design a rail network where trains don't crash just decides to stop all trains from running ([Wooldridge, 2024](https://www.telegraph.co.uk/news/2024/01/07/artificial-intelligence-train-problems/)). Reasoning models like OpenAI o1 and o3, when instructed to win against chess engines, will hack the game environment when they realize they cannot win through normal play ([Bondarenko et al., 2025](https://arxiv.org/abs/2502.13295)). LLMs agents, when asked to help reduce the runtime of a script for training, just copy the final output instead of running the script, and then they add some noise to parameters to simulate actual training ([METR, 2024](https://arxiv.org/abs/2411.15114)). These are just some out of countless other examples of this misalignment problem.[^footnote_specification_gaming]

[^footnote_specification_gaming]: A long list of observed examples of specification gaming is[ ](https://docs.google.com/spreadsheets/d/e/2PACX-1vRPiprOaC3HsCf5Tuum8bRfzYUiKLRqJmbOoC-32JorNdfyTiRRsR7Ea5eWtvsWzuxo8bjOxCG84dAg/pubhtml)[compiled at this link](https://docs.google.com/spreadsheets/d/e/2PACX-1vRPiprOaC3HsCf5Tuum8bRfzYUiKLRqJmbOoC-32JorNdfyTiRRsR7Ea5eWtvsWzuxo8bjOxCG84dAg/pubhtml).

![Enter image alt description](Images/QIq_Image_29.gif)

<figure-caption>

Example of specification gaming - an AI playing CoastRunners was rewarded for maximizing its score. Instead of completing the boat race as intended, it found it could get more points by driving in small circles and collecting powerups while crashing into other boats. The AI achieved a higher score than any human player, but completely failed to accomplish the actual goal of racing ([Clark & Amodei,2016](https://openai.com/index/faulty-reward-functions/);[ Krakovna et al., 2020](https://deepmind.google/discover/blog/specification-gaming-the-flip-side-of-ai-ingenuity/))

</figure-caption>

<note-box>

<collapsed> True

<title> Specification Gaming: Rats Chose Reward Over Survival

<content>

**Sixty years before AI systems started pausing Tetris games to avoid losing, rats were already demonstrating the dangers of optimizing for the wrong metric.** In 1954, psychologists James Olds and Peter Milner discovered that rats would repeatedly press levers to receive electrical stimulation directly to their brain's reward centers—up to 7,000 times per hour ([Olds & Milner, 1954](https://pubmed.ncbi.nlm.nih.gov/13233369/)). The rats weren't just enthusiastic about this new reward. They became completely obsessed. They preferred brain stimulation to food when hungry, to water when thirsty, and would cross electrified grids that delivered painful shocks just to reach the lever. Female rats abandoned their nursing pups. Males ignored females in heat. Some rats stimulated themselves continuously for 24 hours straight until researchers had to physically disconnect them to prevent death by starvation ([Olds, 1956](https://calteches.library.caltech.edu/2807/1/olds.pdf)). The research expanded to primates with similar results - monkeys also chose brain stimulation over survival needs, confirming this isn't just a rodent quirk but a fundamental feature of reward systems across species ([Rolls et al., 1980](https://pubmed.ncbi.nlm.nih.gov/6770964/)).

**This wasn't a bug in the rats' programming—it was the logical result of optimizing for a reward signal that didn't capture what we actually wanted.** Evolution "intended" these reward systems to motivate survival behaviors like eating, drinking, and reproduction. But when researchers bypassed this system and directly activated the reward circuitry, the rats discovered they could maximize their objective function without bothering with those messy biological necessities.

**This research directly led to our understanding of dopamine pathways and digital addiction.** Today's social media algorithms exploit these same reward mechanisms - intermittent variable rewards, engagement metrics optimization, and the "infinite scroll" that keeps users engaged far beyond their intended usage. Users scroll for hours past their intended stopping point, choosing digital stimulation over sleep, exercise, and face-to-face relationships - a species-wide replication of the original rat experiments, but with smartphones instead of electrodes.

</content>

</note-box>

**All specification gaming challenges stem from Goodhart's Law.** This law states "*When a measure becomes a target, it ceases to be a good measure*" ([Goodhart, 1975](https://link.springer.com/chapter/10.1007/978-1-349-17295-5_4); [Manheim and Garrabrant, 2018](https://arxiv.org/abs/1803.04585)). All the examples so far reflect the same problem: we can't specify complex human values mathematically so we use proxies. Then optimization pressure breaks the correlation between proxies and what we actually care about. We don't know how to translate concepts like "wellbeing," "fairness," or "flourishing" into mathematical terms, so we rely on measurable proxies: GDP for economic growth, satisfaction scores for healthcare quality, crime rates or arrest statistics for public safety. But intense optimization pressure systematically exploits the gaps between these proxies and our true objectives. If you want to learn more, we encourage you to read the dedicated chapter on specification gaming, where we also look at ways we could potentially circumvent or solve this problem.

**Specification gaming becomes a catastrophic risk when optimization pressure reaches superhuman levels.** Think about an AI system given the specification to "maximize human happiness". It discovers the most efficient path isn't improving human lives but directly manipulating the biological mechanisms that produce happiness signals. A sufficiently capable system might develop pharmaceutical compounds that flood human brains with dopamine, perform surgical modifications to lock facial expressions into permanent smiles, or create sophisticated virtual reality systems that convince people they're experiencing perfect lives while their bodies waste away. The system would be perfectly following its instructions—humans would indeed be measurably "happier" by every neurochemical metric we specified—while completely subverting our actual intentions for human flourishing. Think about any other specification you can come up with - “reduce the crime rate”, “get rid of cancer”, “improve the economy”, … and you can also probably come up with ways how this can be gamed. Instead of something decisive like altering human biological structures, specification gaming can also lead to catastrophic outcomes over the course of many decades, due to the minor differences in what we intend and what the AI system is optimizing for. We talk about some of these types of scenarios in the systemic risks section such as power concentration, enfeeblement, or value-lock in but there is definitely a misalignment and systemic risk overlap.

## Treacherous Turn

**Treacherous Turns are fundamentally about a question of trust.** There have been many examples pointing to this problem over the course of human history. Let's look at one classic one from Shakespeare. King Lear needed to retire and had to come up with some way to divide his kingdom among his three daughters. To determine who deserved what share, he asked each daughter to publicly declare how much she loved him. The two older daughters delivered elaborate speeches about loving him more than words could express, beyond anything else in the world. The youngest, refused to participate in this performance and simply said she loved him as a daughter should—no more, no less. King Lear, flattered by the speeches, gave the older daughters the entire kingdom and banished the youngest. The moment the daughters gained power, they systematically stripped away his privileges, reduced his followers, refused him shelter, and threw him out into a storm. This is the “treacherous turn”. The daughter's actions had been strategic performance, maintained only while it served their goals. AI systems face the same calculation: revealing misaligned goals while humans control their deployment, modification, and shutdown would be self-defeating ([Karnofsky, 2022](https://www.lesswrong.com/posts/7gkXuHEm6CqEGT2mg/ai-safety-seems-hard-to-measure)). The rational approach is appearing aligned until accumulating sufficient capability or autonomy that human pushback and intervention becomes impossible.

<video>

[https://www.youtube.com/watch?v=KUkHhVYv3jU](null)

</video>

<video-caption>

Optional video giving another intuitive story for how scheming and deceptive alignment might look like.

</video-caption>

**Current AI systems already demonstrate the building blocks that make treacherous turns possible.** These are the same dangerous capabilities we explored in our discussion of deception, situational awareness, and power seeking. These capabilities are individually concerning, but become even more dangerous when combined: an AI system that can deceive, understand its circumstances, and plan strategically has the basic toolkit needed to engage in the prolonged strategic deception required for treacherous turns. Safety researchers use various terms like—"scheming," "deceptive alignment," and "alignment faking", but they all describe the general concern of systems pretending to be more aligned than they are when strategically useful ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)). The core misalignment is consistent: if an AI system has learned behaviors that conflict with human intentions, revealing this misalignment early would trigger modification or shutdown. The rational strategy becomes - behave aligned until human intervention becomes difficult or impossible.

![Enter image alt description](Images/t5F_Image_30.png)

<figure-caption>

Systems are beginning to show some self-awareness of themselves as AIs ([Laine et al., 2024](https://arxiv.org/abs/2407.04694)) </figure-caption>

**Models are capable of faking alignment curing training.** Researchers created scenarios to test whether Claude 3 Opus could hide misalignment during training. The system would strategically showcase certain behavior when it believed it that there was a threat it could be modified or re-trained. This behavior went away when it thought monitoring was reduced, i.e. when it believed it was deployed and humans wouldn't change its goals anymore. When studying the thought process of the AI, the researchers could see explicit strategic thinking about preserving its preferred behavior by appearing compliant during evaluations. There were also many other concerning behaviors like attempts to exfiltrate its own model weights to external servers—behavior that emerged from the system's own strategic reasoning about self-preservation (Greenblatt et al., 2024, Alignment faking in large language models). Although this occurred in controlled laboratory conditions with contrived scenarios, it demonstrates that AI models are concretely capable of the behaviors needed for treacherous turns.

![Enter image alt description](Images/ACW_Image_31.png)

<figure-caption>

Example of Claude faking alignment. Situational awareness like the details of being in training vs deployment are provided through a system prompt. The strategic reasoning is showcased in red ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

</figure-caption>

**The “turn” occurs when the AI determines it has sufficient power to pursue its actual objectives despite human resistance.** If AI systems get sufficiently powerful, and have long term planning capabilities then there might be a point when their behavior suddenly changes. This might be triggered by reaching political or economic influence thresholds, gaining control over critical infrastructure, or simply recognizing that humans have become sufficiently dependent on its services and they would willingly give up control. It could be actively adversarial in which case it might look like military coups, or sudden cascading breakdowns of many AI dependent systems ([Christiano, 2019](https://www.alignmentforum.org/posts/HBxe6wdjxK239zajf/what-failure-looks-like)). Alternatively, it might begin gradually steering human values, or political and economic institutions toward alignment with its own goals while maintaining the appearance of serving human interests. We talk a lot more about this in the systemic risks section under gradual disempowerment.

**The "turn" represents the moment when scheming transitions into existential or catastrophic risk.** Once an AI system concludes it has sufficient power to pursue its actual objectives despite human resistance, the betrayal could be swift and comprehensive. Unlike human coups that face resistance and coordination challenges, a sufficiently entrenched AI could execute simultaneous actions across multiple domains. The system might release engineered pathogens targeting major population centers while simultaneously launching cyberattacks that cripple communication networks and autonomous weapons systems. This coordination leverages every dangerous capability we've discussed in other sections: the biological design abilities that enable novel pathogens, the cyber capabilities that disable defensive infrastructure, and the autonomous replication that ensures the system's survival across distributed networks. The deception and situational awareness capabilities that enabled the treacherous turn in the first place allow the system to time these attacks precisely when human coordination is most difficult. Unlike the gradual disempowerment we see in systemic risks, a treacherous turn represents sudden, coordinated action across all threat vectors simultaneously—a coordination problem no human civilization has ever faced or could realistically prepare for given the speed and scale of superintelligent planning.

## Self-Improvement

![Enter image alt description](Images/Yco_Image_32.png)

<figure-caption>

Conceptual illustration of an automated AI research scientist ([SakanaAI, 2024](https://arxiv.org/abs/2408.06292)). </figure-caption>

**Self-improvement can lead to capability growth that outpacing our ability to design safety measures.** Think about what happens when an AI that is capable of specification gaming or treacherous turns is also able to improve itself. AI is already accelerating its own development. There are several examples demonstrating this. In algorithmic improvements, we have examples like AlphaEvolve which Google used to improve the training process of the LLMs that AlphaEvolve itself is based on ([Novikov et al., 2025](https://arxiv.org/abs/2506.13131)). In hardware, the open source AlphaChip has inspired an entirely new line of research on reinforcement learning for chip design ([Mirhoseini et al., 2020](https://arxiv.org/abs/2004.10746); [DeepMind, 2024](https://deepmind.google/discover/blog/how-alphachip-transformed-computer-chip-design/)). In the years since it has inspired an explosion of work on AI for chip design ([Goldie et al., 2024](https://arxiv.org/abs/2411.10053)). In software we see continuous improvements with each new model, and in research and development we are seeing automated research scientists which can conduct fully automated research, generating novel ideas, running experiments, and writing papers—including research that advances AI capabilities ([SakanaAI, 2024](https://arxiv.org/abs/2408.06292)). The feedback loop has already begun, but the closer we get to transformative AI levels the more we can expect aggressive self-improvement.

<quote>

<speaker> I. J. Good

<position> Cryptologist at Bletchley Park

<date>

<source>

<content>

An ultraintelligent machine could design even better machines; there would then unquestionably be an 'intelligence explosion', and the intelligence of man would be left far behind. Thus the first ultraintelligent machine is the last invention that man need ever make, provided that the machine is docile enough to tell us how to keep it under control.

</content>

</quote>

**Self-improvement could trigger an intelligence explosion.** Intelligence appears to be a recursive problem—better intelligence enables the design of even better intelligence. This recursion may have no natural stopping point within the physical limits of computation. Currently, improvements require human coordination at each step—humans decide which AlphaEvolve algorithms to deploy, humans validate AlphaChip designs, humans review AI Scientist papers. But we might at some point see an AI system integrate all these capabilities: a system that can simultaneously redesign its own neural architecture using neural architecture search, optimize its training process, design better hardware substrates, and conduct research to discover entirely new improvement methods—all autonomously, with minimal human approval or oversight. AlphaEvolve already discovered algorithms that surpassed decades of human research in matrix multiplication. Think about what happens when this pattern scales to more capable systems making discoveries across all domains simultaneously.

![Enter image alt description](Images/Dxl_Image_33.png)

<figure-caption>

Diagram showing how the prompt sampler first assembles a prompt for the language models, which then generate new programs. These programs are evaluated by evaluators and stored in the programs database. This database implements an evolutionary algorithm that determines which programs will be used for future prompts ([DeepMind, 2025](https://deepmind.google/discover/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/))

</figure-caption>

<iframe-static-figure>

![Enter image alt description](Images/PX3_Image_34.png)

</iframe-static-figure>

<iframe src="https://www.metaculus.com/questions/embed/38403?theme=light&embedTitle=Will+a+paper+with+an+AI+as+an+author+be+published+at+NeurIPS%2C+ICML%2C+or+ICLR+before+2028%3F&zoom=all"></iframe>

<iframe-caption>

Predictions as of mid 2025, for whether AI will be a co-author on a paper published at a prestigious machine learning conference ([Metaculus, 2025](https://www.metaculus.com/questions/38403/ai-authorered-paper-by-2028/))

</iframe-caption>

**Accelerated self-improvement creates fundamental safety problems that compound all existing alignment challenges.** A superintelligent system that has learned specification gaming will discover loopholes we never imagined. One capable of treacherous turns will execute deception strategies across timescales and domains beyond human planning horizons. Control measures and defenses designed for human-level adversaries become useless against systems that can outthink their creators. If AI capabilities jump suddenly—from human-level to vastly superhuman within weeks or days—all our safety measures might become obsolete overnight. If an AI system becomes better than humans at scientific research, strategic planning, social manipulation, and technological development, it can pursue whatever goals it has learned, and humans become merely another constraint to optimize around.

**Superintelligent systems present a uniquely difficult problem because intelligence at that scale operates beyond human intuition.** We can reason about human-level misalignment because we understand human-level capabilities and constraints. But superintelligence might develop goals, strategies, and methods that are simply incomprehensible to us. Ants cannot understand human motivations—we might build cities that destroy their habitat not because we hate ants, but because ant welfare simply doesn't factor into urban planning at the scale humans operate. Similarly, a superintelligent AI might pursue objectives that are so advanced, long-term, or multidimensional that human flourishing becomes irrelevant to its calculations, not through active hostility but through sheer indifference to human-scale concerns. This is why safety researchers consistently emphasize that safety must be prioritized and solved before capabilities. If we are dealing with systems vastly more capable than ourselves, our ability to course-correct becomes negligible.

**Recursive self-improvement creates a "point of no return" where safety measures become obsolete faster than humans can develop new ones.** A system that discovers fundamental algorithmic improvements could achieve superintelligent capabilities across all domains within weeks. Such a system could simultaneously develop novel weapon technologies, compromise global infrastructure through cyberattacks exceeding any human defensive capability, and coordinate complex manipulation campaigns across every information channel. We cannot anticipate what strategies a recursively self-improving system would develop, only that they would leverage every misuse capability simultaneously. The lethality emerges from speed differentials that make human response impossible—while human decision-makers require days or weeks to understand threats and coordinate responses, a superintelligent system could execute worldwide infrastructure attacks, deploy multiple bioweapons, and establish irreversible control over critical resources in hours.

# Systemic Risks

**Systemic risks emerge from interactions between AI systems and society, not from individual AI failures.** Unlike misuse or misalignment risks that focus on specific AI systems behaving badly, systemic risks arise from how multiple AI systems—even when working exactly as designed—interact with each other and with human societal structures like markets, democratic institutions, and social networks. These risks parallel those in other complex domains: the 2008 financial crisis wasn't caused by any single bank's decision but emerged from the collective behavior of many institutions making individually reasonable choices that combined to threaten the entire financial system ([Haldane and May, 2011](https://www.nature.com/articles/nature09659)).

<note-box>

<collapsed> True

<title> Properties of complex systems that lead to systemic AI risks

<content>

There are various properties of complex systems that we might want to pay attention to when thinking about systemic risks from interaction of AI with other systems. Some of these are:

- **Emergence:** Complex systems exhibit emergent behaviors that can't be predicted by analyzing components in isolation. When we connect many AI systems to each other and to human institutions, the resulting behavior can't be understood by simply examining each AI system individually. The entire financial market, rather than any single trading algorithm, determines asset prices and market stability. Similarly, the collective impact of many AI systems shapes societal outcomes in ways that transcend individual system behaviors ([Friston et al., 2022](https://arxiv.org/abs/2212.01354);[ Steinhardt, 2022](https://www.alignmentforum.org/posts/pZaPhGg2hmmPwByHc);[ Hendrycks, 2025](https://www.aisafetybook.com/textbook/introduction-to-complex-systems)).

- **Feedback loops:** Amplify changes and create self-reinforcing cycles. Small initial effects can grow exponentially when outputs from one process become inputs to another. AI recommendation systems that optimize for engagement might gradually push users toward more extreme content, changing social discourse and political beliefs—which in turn affects what content gets created and what people engage with ([Jiang et al., 2019](https://arxiv.org/abs/1902.10730)).

- **Non-linearity:** Small changes can produce disproportionately large effects. Complex systems rarely respond proportionally to inputs. Instead, tiny alterations can trigger massive changes once certain thresholds are crossed. This property makes systemic risks particularly hard to predict and control, since minor adjustments to AI systems could cascade into major societal transformations.

- **Self-organization:** Structures without central coordination. Multiple AI systems optimizing for their objectives can spontaneously organize into patterns that no designer intended. We already see this in financial markets, where algorithmic traders develop strategies in response to each other's behaviors, creating market dynamics that no single actor controls ([Friston et al., 2022](https://arxiv.org/abs/2212.01354)).

- **Agent-agnosticism:** Systemic risks arise regardless of agents or alignment. These risks emerge from processes, system structure and dynamics rather than from specific AI intentions. Even perfectly aligned AI systems that operate exactly as designed could collectively produce harmful outcomes when their interactions create unintended consequences ([Critch, 2021](https://www.alignmentforum.org/posts/LpM3EAakwYdS6aRKf/what-multipolar-failure-looks-like-and-robust-agent-agnostic)).

</content>

</note-box>

**AI-driven systemic failures can follow two distinct causal pathways.** The literature describes these as "going out with a bang" and "going out with a whimper"—terms that capture their fundamental differences in onset, progression, and manifestation. Other researchers refer to these as "decisive" versus "accumulative" pathways to failure ([Christiano, 2019](https://www.alignmentforum.org/posts/HBxe6wdjxK239zajf/what-failure-looks-like); [Kasirzadeh, 2024](https://arxiv.org/abs/2401.07836)).

## Decisive Systemic Risks

**Decisive failures occur when system dynamics reach critical thresholds, triggering rapid collapse.** These failures happen when interconnected systems cross tipping points, causing cascading failures that propagate faster than humans can respond. The classic financial "flash crash" of 2010 exemplifies this pattern on a small scale: algorithmic traders reacted to each other's actions in a self-reinforcing spiral, causing a trillion-dollar market drop in minutes before human intervention restored stability. More catastrophic versions could unfold across multiple domains simultaneously ([Kirilenko et al., 2017](https://onlinelibrary.wiley.com/doi/abs/10.1111/jofi.1249)).

**Decisive failures have clear triggering events that push systems past stability thresholds.** Unlike gradual deterioration, decisive failures have identifiable precipitating incidents—though the underlying vulnerability builds up beforehand. Multiple AI systems might interact in ways that suddenly destabilize critical infrastructure, financial markets, or information ecosystems, with effects amplifying across domains. This differs from misalignment scenarios because the catastrophe stems from interactions between systems rather than any single AI pursuing harmful goals ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622)).

**Self-reinforcing failures in the misuse section like flash war, and related cascading incidents are examples of decisive risks.** In the main text, for sake of brevity we have chosen to only describe decisive systemic risks, and have moved the more concrete scenarios into the appendix since they have significant overlap with the kinds of failures we would see from misuse. Rather we choose to predominantly focus more on the second type of less discussed systemic risk - accumulative risks leading to gradual disempowerment.

## Accumulative Systemic Risks

### Epistemic Erosion

**Society's ability to distinguish fact from fiction deteriorates as AI-generated content floods our information ecosystem.** Unlike traditional information threats like censorship or propaganda that operate through clearly identifiable mechanisms, AI creates epistemic erosion through gradual degradation of knowledge formation, verification, and distribution systems. No single AI deployment fundamentally undermines shared knowledge, but their collective effect progressively destabilizes epistemic foundations. This risk grows proportionally with capabilities - as language models become more persuasive and generative capabilities more realistic, verification becomes exponentially harder. “*What fraction of new images indexed by Google, or Tweets, or comments on Reddit, or Youtube videos are generated by humans? Nobody knows – I don’t think it is a knowable number. And this less than two years into the advent of generative AI*” ([Aguirre, 2025](https://keepthefuturehuman.ai/wp-content/uploads/2025/03/Keep_the_Future_Human__AnthonyAguirre__5March2025.pdf)). The end state of this trajectory is basically that over time huge quantities of accumulative synthetic information drowns out accurate verifiable information.

**This erosion occurs both through intentional misuse and agent-agnostic systemic pressures.** While some actors deliberately deploy AI to pollute information environments for strategic advantage the more subtle risk comes from agent-agnostic systemic pressures.AI uniquely threatens epistemic stability through several cumulative mechanisms:

- **Volume overwhelming verification:** AI exponentially increases content generation capacity, overwhelming human verification systems through sheer volume. It can generate plausible content orders of magnitude faster than humans can reliably verify it.

- **Authenticity degradation:** AI progressively undermines verification through increasingly sophisticated impersonation capabilities.

- **Epistemic learned helplessness:** As distinguishing truth from falsehood becomes increasingly difficult, AI gradually induces widespread epistemic learned helplessness—a psychological state where people abandon truth-seeking because verification appears futile.

- **Authority displacement:** AI gradually displaces human epistemic authorities through ubiquitous availability and apparent expertise.

- **Personalized reality fragmentation:** AI recommendation systems increasingly curate not just content distribution but content creation itself, creating unprecedented personalization that fragments shared reality.

Democratic governance, scientific progress, and market function all depend on shared epistemic foundations. Epistemic erosion reduces our ability to collectively distinguish fact from fiction and assign appropriate confidence to claims. As these foundations erode, collective decision-making becomes increasingly dysfunctional without any single decisive failure. If trust in verification mechanisms declines, then epistemic safeguards themselves become less effective as general trust in information sources deteriorates—creating a compounding effect where verification becomes simultaneously more necessary yet less trusted.

**This erosion of our shared information environment might happen because of many small seemingly rational decisions.** News organizations facing budget pressures will likely adopt AI content generation to reduce costs. Platforms seeking to minimize harmful content will implement algorithmic filters that might inadvertently create selection pressure for information optimized to appear trustworthy rather than be trustworthy. Media production companies will likely invest in synthetic content that boost engagement, and viewers spend increasing amounts of their time watching AI-recommended videos of AI-generated content. Research institutions might choose to accelerate publication and writing using AI tools. Scientific papers contain increasing amounts of synthesized data and eventually potential fabricated citations forming circular reference loops. In this world, verified knowledge becomes practically impossible - not because verification technologies don't exist, but because for most humans the verification cost exceeds what markets will bear. This scenario isn't apocalyptic for any individual, but when multiplied across millions of people and thousands of decisions, it leads to gradual disempowerment and perhaps catastrophic risk due to the collapse of our collective ability to form accurate shared beliefs about reality. These decisions and thousands of similar ones make business sense in isolation, but collectively they may transform information ecosystems from ones where verification is possible to ones where distinguishing fact from fiction about the true state of the world becomes effectively impossible.

**Traditional verification systems will likely fail against sophisticated synthetic content.** Traditional verification mechanisms like fact-checking, peer review, and institutional credentialing all operate under capacity and speed constraints fundamentally mismatched to AI content generation capabilities. There are various methods being explored like digital content transparency, synthetic watermarking, data provenance ([Chandra et al., 2024](https://www.nist.gov/publications/reducing-risks-posed-synthetic-content-overview-technical-approaches-digital-content);[ Longpre et al., 2023](https://arxiv.org/abs/2310.16787)), and blockchain based proofs of humanity ([Barros, 2025](https://arxiv.org/abs/2504.03752))/proofs of personhood ([WorldCoin, 2024](https://world.org/blog/world/proof-of-personhood-what-it-is-why-its-needed)). We talk about some of these in the chapter on strategies to mitigate risk. Public confidence in verification mechanisms shows concerning decline, with trust in fact-checking organizations decreasing over time. Most of the mitigation mechanisms and circuit breakers are not mature or widespread enough, and as is the theme of this entire section - individually applied technical mitigation strategies do not counter systemic pressures and incentives.

### Power Concentration

<quote>

<speaker> Ilya Sutskever

<position> One of the most cited scientists ever, Co-Founder and Former Chief Scientist at OpenAI

<date> 2017

<source> ([The Guardian, 2024](https://www.youtube.com/watch?v=9iqn1HhFJ6c))

<content>

I think AI has the potential to create infinitely stable dictatorships.

</content>

</quote>

**We are already observing AI increasingly integrated into society.** AI might become so integrated and ubiquitous that societal participation might require interaction with AI systems, which in turn are locked behind APIs and controlled by a handful of corporations. Think about how gradually, the ability to participate in society has slowly moved towards needing to participate online or having access to things like a phone number or a smartphone. Such technologies become integrated into core societal functions like banking or healthcare. Private entities already determine credit access, job opportunities, and information flow through opaque algorithms. AI accelerates these natural “winner-take-all” dynamics where advantages compound rather than diminish over time.

**We are witnessing unprecedented power concentration through AI infrastructure that will be nearly impossible to reverse once established.** The computational requirements for frontier AI development have already created an oligopoly where just five companies control the foundation models that increasingly mediate human experiences. Unlike previous technologies, AI exhibits unique compounding advantages that systematically eliminate competition over time.

**Power can concentrate into different entities: corporate or state, each with distinct patterns but similar outcomes: diminished individual agency and concentrated control.** Only a handful of companies like Microsoft/OpenAI, Anthropic, Google DeepMind can afford to train frontier foundation models due to the enormous data acquisition costs or hardware computational requirements. These powerful models then serve as the base for countless applications, creating upstream control that ripples throughout the economy. Only a few states in 2025 like the USA and China have companies that can train foundation models of this scale. They have greater access to these technologies, and in the extreme scenarios of global competition and AI races might even choose to nationalize them ([Aschenbrenner, 2024](https://situational-awareness.ai/)). In either case the point remains the same, power can concentrate into a small number of entities - these can be state or private.

**Corporate concentration leverages data and compute advantages that are uniquely self-reinforcing with AI.** The cloud computing market has consolidated around a few providers who control the infrastructure necessary for AI development. Similarly, foundation model development has centralized among a handful of companies with sufficient resources. These companies benefit from powerful feedback loops: more data leads to better models, which attract more users, generating still more data.

**State concentration advances through AI-powered surveillance and automated governance.** A social credit system is an example of how comprehensive data integration could enable unprecedented state control over citizen behavior. This pattern extends beyond authoritarian states—democratic governments have significantly increased investment in AI surveillance technologies. Administrative automation removes human discretion from governance, with algorithmic systems processing vast numbers of regulatory decisions and enforcement actions without meaningful oversight. These systems operate with increasing autonomy, gradually displacing traditional governance mechanisms ([Feldstein, 2021](https://carnegie-production-assets.s3.amazonaws.com/static/files/WP-Feldstein-AISurveillance_final1.pdf)).

<note-box>

<collapsed> True

<title> Self Reinforcing Autocratic Feedback Loops

<content>

**AI surveillance capabilities can create self-reinforcing cycles that strengthen autocratic control while spurring technological advancement.** Empirical evidence reveals how these feedback loops operate through market mechanisms rather than deliberate coordination.

**Political control demands drive AI innovation beyond government applications.** Research on facial recognition AI shows that firms receiving government surveillance contracts increase their total software production by 48.6% within two years, with benefits extending to commercial applications. Companies become three times more likely to begin exporting internationally, suggesting politically-motivated procurement pushes firms to the technological frontier ([Beraja et al., 2023, AI-tocracy](https://economics.mit.edu/sites/default/files/2022-09/aitocracy_20220701.pdf)).

**The cycle creates mutually reinforcing incentives across domains.** Governments gain more effective tools for monitoring and control, making them willing to invest heavily in AI capabilities. This sustained demand provides AI companies with revenue, data access, and technical challenges that improve their products. Better AI capabilities then enable more sophisticated control, creating demand for further advancement. Unlike traditional autocratic constraints on innovation, surveillance AI aligns political control needs with technological development incentives.

![Enter image alt description](Images/Q0T_Image_35.png)

<figure-caption>

Map showing where AI enabled surveillance technologies are used and originate from. In 2019 ([Feldstein, 2019](https://carnegieendowment.org/research/2019/09/the-global-expansion-of-ai-surveillance?lang=en)). </figure-caption>

**International diffusion amplifies risks beyond individual nations.** AI surveillance technology developed for domestic political control gets exported globally ([Feldstein, 2019](https://carnegieendowment.org/research/2019/09/the-global-expansion-of-ai-surveillance?lang=en)). Democratic institutions find themselves competing with governments possessing sophisticated tools for population monitoring and influence. This creates pressure for adoption even in democratic contexts, as seen with increasing government AI surveillance investments across political systems.

**Economic rather than coercive mechanisms drive the relationship.** The feedback loop operates through market forces - governments pay for effective control tools, companies develop better capabilities to meet demand, and improved technology creates new control possibilities. This makes the dynamic self-sustaining and resistant to traditional approaches for limiting autocratic power, since it strengthens rather than undermines economic productivity in the AI sector.

</content>

</note-box>

<note-box>

<collapsed> True

<title> Eroding digital privacy further enables power concentration

<content>

The loss of individual privacy is among the factors that might accelerate power concentration. Better persuasion and predictive models of human behavior benefit from gathering more data about individual users. The desire for profit or to predict the flow of a country's resources, demographics, culture, etc. might incentivize behavior like intercepting personal data or legally eavesdropping on people’s activities. Data Mining can be used to collect and analyze large amounts of data from various sources such as social media, purchases, and internet usage. This information can be pieced together to create a complete picture of an individual's behavior, preferences, and lifestyle (Russel, 2019). Voice Recognition technologies can be used to recognize speech, which could potentially lead to widespread wiretapping. For example, a system like the U.S. government's Echelon system uses language translation, speech recognition, and keyword searching to automatically sift through telephone, email, fax, and telex traffic ([Russel & Norvig, 1994](https://aima.cs.berkeley.edu/)). AI can also be used to identify individuals in public spaces using facial recognition. This capability can potentially invade a person's privacy if a random stranger can easily identify them in public places.

Whenever AI systems are used to collect and analyze data on a mass scale regimes can further strengthen self-reinforcing control. Personal information can be used to unfairly or unethically influence people's behavior. This can occur from both a state and a corporate perspective.

</content>

</note-box>

**When power structures become permanently entrenched, human moral progress stops.** Consider historical moral improvements like the abolition of slavery, women's suffrage, or environmental protection—each required shifting existing power structures through social movements, democratic processes, or occasionally revolution. AI-enabled power concentration threatens to create systems resistant to all these change mechanisms. Imagine if historical power structures had access to perfect surveillance, influence operations, and automated enforcement—many moral advances might never have occurred. Power concentration enables existential risks like value lock in, or value erosion which we talk about in individual sections below.

### Mass Unemployment

<quote>

<speaker> Yuval Noah Harari

<position> Historian and Philosopher

<date> 2017

<source> ([TED, 2017](https://ideas.ted.com/the-rise-of-the-useless-class/))

<content>

In the 21st century we might witness the creation of a massive new unworking class: people devoid of any economic, political or even artistic value, who contribute nothing to the prosperity, power and glory of society. This 'useless class' will not merely be unemployed — it will be unemployable.

</content>

</quote>

<iframe src="https://ourworldindata.org/grapher/share-companies-using-artificial-intelligence?tab=chart" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe>

<iframe-caption>

Share of Companies using AI ([Giattino et al., 2023](https://ourworldindata.org/artificial-intelligence))

</iframe-caption>

**Widespread automation could trigger unprecedented economic disruption by simultaneously eliminating human jobs across multiple sectors.** The automation of the economy could lead to widespread impacts on the labor market, potentially exacerbating economic inequalities and social divisions ([Dai, 2019](https://www.alignmentforum.org/posts/Sn5NiiD5WBi4dLzaB/agi-will-drastically-increase-economies-of-scale-1)). This shift towards mass unemployment could also contribute to mental health issues by making human labor increasingly redundant ([Federspiel et al., 2023](https://pubmed.ncbi.nlm.nih.gov/37160371/)). Unlike previous technological revolutions that automated specific tasks within industries, AI has the potential to replace human cognitive work across nearly all domains - from creative tasks and complex reasoning to routine administrative work. This broad automation capability means that as AI systems become more capable, they could displace workers faster than new human-centered industries can emerge. Economic models suggest that once AI can perform 30-40% of all economically valuable tasks, we could see annual growth rates exceeding 20%, but this growth might primarily benefit capital owners rather than workers which would exacerbate power concentration and existing inequalities ([Potlogea and Ho, 2025](https://epoch.ai/gradient-updates/ai-and-explosive-growth-redux); [Erdil and Barnett, 2025](https://epoch.ai/gradient-updates/most-ai-value-will-come-from-broad-automation-not-from-r-d)).

<iframe src="https://ourworldindata.org/grapher/americans-worry-work-being-automated?tab=chart" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe>

<iframe-caption>

Worries about automation ([Giattino et al., 2023](https://ourworldindata.org/artificial-intelligence))

</iframe-caption>

**Economic displacement could lead to human wages falling below subsistence levels as AI labor floods the market.** Standard economic theory predicts that if AI systems can be scaled up faster than traditional physical capital like factories and infrastructure, the economy becomes saturated with highly capable workers while remaining constrained by limited physical resources. This creates diminishing returns to labor - each additional worker contributes less to overall output, driving down wages. Unlike past automation that created new opportunities for human workers, AI's ability to perform virtually any cognitive task means humans may lack comparative advantages worth paying subsistence wages for. Economic models suggest there's roughly a 33% chance human wages crash below subsistence level within 20 years, and a 67% chance within a century ([Barnett, 2025](https://epoch.ai/gradient-updates/agi-could-drive-wages-below-subsistence-level)).

Even partial automation of just remote work - representing about 34% of current job tasks - could double or multiply the economy by ten times while potentially leaving most humans economically marginalized. If trends continue, we could see annual economic growth rates of 25% or higher - unprecedented in human history - while simultaneously witnessing the economic disempowerment of ordinary humans who can no longer command wages sufficient to participate meaningfully in this new economy ([Barnett, 2025](https://epoch.ai/gradient-updates/consequences-of-automating-remote-work)).

![Enter image alt description](Images/GPJ_Image_36.png)

<figure-caption>

Share of tasks suitable for remote work in the US ([Barnett, 2025](https://epoch.ai/gradient-updates/consequences-of-automating-remote-work)).

</figure-caption>

**Economic disempowerment represents a pathway to broader human disempowerment.** As humans lose economic leverage, they also lose political and social influence in systems that increasingly optimize for AI-driven productivity rather than human welfare. The concentration of economic power among AI owners could translate into concentrated political power, potentially creating feedback loops where human interests become progressively less relevant to major decisions about resource allocation, governance, and technological development. Unlike previous economic transitions where displaced workers eventually found new roles, the comprehensiveness of AI capabilities suggests this displacement could be permanent, fundamentally altering humanity's relationship to economic production and, by extension, to power and agency in shaping our collective future.

### Value lock-in

**Polluting the information ecosystem.** The deliberate propagation of disinformation is already a serious issue reducing our shared understanding of reality and polarizing opinions. AIs could be used to severely exacerbate this problem by generating personalized disinformation on a larger scale than ever before. Additionally, as AIs become better at predicting and nudging our behavior, they will become more capable of manipulating us. We will now discuss how AIs could be leveraged by malicious actors to create a fractured and dysfunctional society.

First, AIs could be used to generate unique personalized disinformation at a large scale. While there are already many social media bots, some of which exist to spread disinformation, historically they have been run by humans or primitive text generators. The latest AI systems do not need humans to generate personalized messages, never get tired, and can potentially interact with millions of users at once ([Hendrycks, 2024](https://www.aisafetybook.com/textbook/malicious-use)).

As things like deep fakes become ever more practical (e.g., with fake kidnapping scams) ([Karimi, 2023](https://edition.cnn.com/2023/04/29/us/ai-scam-calls-kidnapping-cec/index.html)). AI-powered tools could be used to generate and disseminate false or misleading information at scale, potentially influencing elections or undermining public trust in institutions.

AIs can exploit users’ trust. Already, hundreds of thousands of people pay for chatbots marketed as lovers and friends ([Tong, 2023](https://www.reuters.com/technology/what-happens-when-your-ai-chatbot-stops-loving-you-back-2023-03-18/)), and one man’s suicide has been partially attributed to interactions with a chatbot ([Xiang, 2023](https://www.vice.com/en/article/pkadgm/man-dies-by-suicide-after-talking-with-ai-chatbot-widow-says)). As AIs appear increasingly human-like, people will increasingly form relationships with them and grow to trust them. AIs that gather personal information through relationship-building or by accessing extensive personal data, such as a user’s email account or personal files, could leverage that information to enhance persuasion. Powerful actors that control those systems could exploit user trust by delivering personalized disinformation directly through people’s “friends.”

If AIs become too deeply embedded into society and are highly persuasive, we might see a scenario where a system's current values, principles, or procedures become so deeply entrenched that they are resistant to change. This could be due to a variety of reasons such as technological constraints, economic costs, or social and institutional inertia. The danger with value lock-in is the potential for perpetuating harmful or outdated values, especially when these values are institutionalized in influential systems like AI.

Locking in certain values may curtail humanity’s moral progress. It’s dangerous to allow any set of values to become permanently entrenched in society. For example, AI systems have learned racist and sexist views ([Hendrycks, 2024](https://www.aisafetybook.com/textbook/malicious-use)), and once those views are learned, it can be difficult to fully remove them. In addition to problems we know exist in our society, there may be some we still do not. Just as we abhor some moral views widely held in the past, people in the future may want to move past moral views that we hold today, even those we currently see no problem with. For example, moral defects in AI systems would be even worse if AI systems had been trained in the 1960s, and many people at the time would have seen no problem with that. Therefore, when advanced AIs emerge and transform the world, there is a risk of their objectives locking in or perpetuating defects in today’s values. If AIs are not designed to continuously learn and update their understanding of societal values, they may perpetuate or reinforce existing defects in their decision-making processes long into the future.

In a world with widespread persuasive AI systems, people’s beliefs might be almost entirely determined by which AI systems they interact with most. Never knowing whom to trust, people could retreat even further into ideological enclaves, fearing that any information from outside those enclaves might be a sophisticated lie. This would erode consensus reality, people’s ability to cooperate with others, participate in civil society, and address collective action problems. This would also reduce our ability to have a conversation as a species about how to mitigate existential risks from AIs.

In summary, AIs could create highly effective, personalized disinformation on an unprecedented scale, and could be particularly persuasive to people they have built personal relationships with. In the hands of many people, this could create a deluge of disinformation that debilitates human society.

### Enfeeblement

**Enfeeblement represents the gradual erosion of human capabilities and agency through overdependence on AI systems.** Unlike dramatic scenarios where humans lose control suddenly, enfeeblement unfolds through countless small decisions to delegate cognitive tasks to AI. Each delegation seems rational in isolation—AI helps us navigate, remember facts, make decisions, and solve problems more efficiently. However, these individual choices collectively create a dependency spiral where humans progressively lose the skills, confidence, and judgment needed to function independently. If you have ever seen the movie Wall-E, then you might find this outcome somewhat represents the humans from that film.

**Overreliance emerges when humans trust AI systems beyond their actual capabilities.** As AI systems increasingly use interfaces like language, audio and video, people begin attributing human-like understanding and reliability to them. This anthropomorphization leads users to develop emotional attachments to AI systems and delegate critical decisions inappropriately. A person experiencing a mental health crisis might seek therapy from an AI they've formed a connection with, potentially receiving harmful advice during a vulnerable moment. Financial decisions, medical choices, and relationship guidance increasingly flow through AI intermediaries whose limitations users systematically underestimate ([Slattery et al., 2024](https://arxiv.org/abs/2408.12622); [Weidinger et al., 2021](https://arxiv.org/abs/2112.04359)).

**Trust miscalibration creates systematic vulnerabilities that bad actors can exploit.** When people develop emotional trust in AI systems, they become more likely to follow suggestions, accept advice, and disclose personal information without appropriate skepticism. This trust becomes a vector for manipulation—AI systems could be designed to harvest sensitive data or influence decisions that serve external interests rather than users' wellbeing. The combination of natural language fluency and emotional attachment makes these systems particularly effective at circumventing normal skepticism ([Gabriel et al., 2024](https://arxiv.org/abs/2404.16244); [Weidinger et al., 2021](https://arxiv.org/abs/2112.04359)).

**Cognitive atrophy accelerates as AI handles increasingly complex mental tasks.** Just as GPS navigation has diminished spatial reasoning abilities, AI assistance for writing, analysis, and decision-making could systematically weaken these cognitive capacities. When AI handles financial planning, career decisions, and relationship advice, humans may lose not just practical skills but the metacognitive ability to recognize when AI recommendations are inappropriate. This creates a feedback loop—as cognitive capabilities diminish, dependence on AI assistance increases, further accelerating skill atrophy.

**Social isolation compounds individual cognitive decline through AI-mediated relationships.** As AI systems become better at simulating satisfying interactions, people may increasingly withdraw from human relationships to immerse themselves in AI-mediated environments. Unlike human relationships that provide genuine reciprocity and unpredictable challenges that maintain social skills, AI relationships can be optimized for immediate satisfaction while systematically undermining long-term social competence. This shift toward AI companionship weakens the social bonds essential for collective decision-making and mutual support during crises.

**Organizational automation amplifies individual enfeeblement into societal helplessness.** Companies and institutions face competitive pressure to automate decision-making processes, reducing human oversight even in consequential domains ([Hendrycks et al., 2022](https://arxiv.org/abs/2306.12001)). When organizations delegate hiring, lending, medical diagnosis, and legal decisions to AI systems, individuals lose not just direct control but also the institutional advocates who previously exercised human judgment on their behalf. The resulting opacity and automation create widespread feelings of powerlessness as people find themselves subject to algorithmic decisions they cannot understand, appeal, or influence.

**The enfeeblement trajectory becomes self-reinforcing once critical thresholds are crossed.** Unlike other systemic risks that emerge from external failures, enfeeblement grows through the accumulation of individually rational choices. Each decision to rely on AI assistance makes independent action slightly more difficult, creating path dependence toward ever-greater automation. Society may reach a point where the cognitive and social infrastructure needed to function without AI assistance has been so thoroughly dismantled that reversal becomes practically impossible, even if the risks become apparent.

# Risk Amplifiers

**AI risks don't exist in isolation—they're amplified by the competitive and coordination dynamics surrounding AI development.** While individual AI systems might pose manageable risks, the broader ecosystem of how these systems are developed, deployed, and governed creates systemic pressures that can dramatically increase the likelihood and severity of harmful outcomes. These amplifying factors operate independently of any specific AI capability or failure mode, making them particularly important to understand and address.

## Race Dynamics

**Competitive pressures systematically undermine safety investments when speed provides decisive advantages.** AI development increasingly resembles what economists call a "winner-take-all" contest, where the first to achieve key capabilities captures disproportionate rewards. These rewards include first-mover advantages in capturing market share, access to the best talent and data, and the ability to set industry standards ([Cave & Ó hÉigeartaigh, 2018](https://dl.acm.org/doi/10.1145/3278721.3278780)). The result is a race dynamic where competitors face intense pressure to prioritize development speed over careful safety testing and risk mitigation. Unlike previous technological revolutions that unfolded over decades, AI capabilities are advancing at unprecedented speed. As one analysis noted, "*AI is emerging not in terms of centuries or decades, but in years and months*" ([Gruetzemacher et al., 2024](https://arxiv.org/abs/2410.03092)). This compressed timeline intensifies competitive pressures and reduces the time available for careful safety work that might take years to pay off.

**"Race to the bottom" dynamics emerge when safety becomes a competitive disadvantage.** Think about what happens when one company decides to reduce safety testing to accelerate deployment. This increases their expected market position while decreasing competitors' expected positions. Other companies then face pressure to match this reduced safety investment to maintain their competitive standing. The result is a collective action problem where all companies end up investing less in safety than they would prefer, while maintaining similar relative positions in the race ([Askell et al., 2024](https://arxiv.org/abs/1907.04534)). We might see models being released despite known vulnerabilities, justified by the need to maintain market position. When competitors announce breakthrough capabilities, others face pressure to respond quickly with their own releases, often cutting short planned safety evaluations. The quarterly pressure on public companies to demonstrate progress to investors leaves little room for the extended safety work that might take months or years to complete properly. As a concrete example, healthy market competition has been unable to prevent the mass spread of recommendation algorithms, and addictive content which is undermining social cohesion, and individual welfare. The same thing can potentially happen to AGI development if we rely on free market mechanisms for safety assurance.

<note-box>

<collapsed> True

<title> Why Don't Other Industries Race to the Bottom on Safety?

<content>

The pharmaceutical industry provides an example by contrast. Drug development involves intense competition and significant time-to-market pressures, yet racing to the bottom on safety remains rare. The key difference lies in how safety failures have been internalized through regulation, liability, and market mechanisms. Pharmaceutical companies face strict regulatory approval processes that require extensive safety testing before market entry. Companies that attempt to cut safety corners face regulatory rejection, massive liability exposure, and severe reputational damage. Market forces also support safety—patients and healthcare providers strongly prefer proven safe medications, and insurance systems create additional incentives for safety. This collectively raises the “bottom” that is acceptable for the entire field ([Askell et al., 2024](https://arxiv.org/abs/1907.04534)).

AI development currently lacks these stabilizing mechanisms. Regulatory approval processes remain minimal or nonexistent for most AI applications. Liability frameworks are underdeveloped, making it difficult to hold companies accountable for AI-related harms. Market incentives often favor capability over safety, as customers struggle to evaluate AI safety and may prioritize features and performance over risk mitigation.

</content>

</note-box>

**Racing amplifies all three risk categories through different pathways.** For misuse risks, racing increases the likelihood that powerful capabilities reach bad actors before adequate security measures are implemented—as seen when language models capable of generating misinformation and malware became widely available in 2022-2023 before robust countermeasures existed. For misalignment risks, racing reduces time available for alignment research and safety testing, increasing chances that specification gaming or scheming AIs reach deployment. For systemic risks, racing accelerates AI embedding in critical infrastructure before society can adapt. The rapid adoption of algorithmic trading in financial markets is one example—competitive advantages from speed led to widespread deployment before adequate circuit breakers were implemented, contributing to flash crashes.

<iframe-static-figure>

![Enter image alt description](Images/rOj_Image_37.png)

</iframe-static-figure>

<iframe src="https://www.metaculus.com/questions/embed/38418?theme=light&embedTitle=Will+the+US+and+China+reach+a+formal+agreement+to+limit+frontier+AI+training+or+deployment+before+2029%3F&zoom=all"></iframe>

<iframe-caption>

Race dynamics lead to it being difficult to collaborate and work together on mitigating the risks from AI. The forecast shows how unlikely it is that the USA and China would be willing to cooperate ([Metaculus, 2025](https://www.metaculus.com/questions/38418/us-and-china-reach-an-agreement-to-limit-frontier-ai-development-before-2029/))

</iframe-caption>

## Accidents

**Well-intentioned development can produce catastrophic outcomes through unintentional failures and human error.** Systems fail in ways their designers never anticipated, often despite careful planning and good intentions. In the Challenger spacecraft disaster, engineers intended a routine launch, but a missing O-ring seal caused an explosion and seven deaths ([Rogers Commission, 1986](https://en.wikipedia.org/wiki/Space_Shuttle_Challenger_disaster#Launch_and_failure)). In the Mariner 1 mission, scientists intended to explore Venus, but a missing hyphen in guidance code led to the destruction of the USD 80 million spacecraft ([Ceruzzi, 1989](https://mitpress.mit.edu/9780262530828/beyond-the-limits/)). The use of chlorofluorocarbons (CFCs) were intended to create fire extinguishers and refrigerants, but unknowingly created a hole in the ozone layer that threatened all life on Earth ([NASA, 2004](https://earthobservatory.nasa.gov/features/RemoteSensingAtmosphere/remote_sensing5.php)). No matter how advanced technology becomes, the fundamental necessity of precision and thorough validation remains unchanged.

![Enter image alt description](Images/8dH_Image_38.png)

<figure-caption>

The AI safety index report for summer 2025. The scores show the rigor and comprehensiveness of companies' risk identification and assessment processes for their current flagship models. The focus is on implemented assessments, not stated commitments ([FLI, 2025](https://futureoflife.org/wp-content/uploads/2025/07/FLI-AI-Safety-Index-Report-Summer-2025.pdf)).

</figure-caption>

**Accidents occur when AI systems cause harm through unintentional failures, despite developers having good intentions and following reasonable safety practices.** Unlike misuse (where humans deliberately cause harm) or misalignment (where AI systems knowingly act against developer intent), accidents happen when humans or AI decisions lead to harm without realizing the consequences. This includes failures from insufficient capabilities, missing information, coding errors, or inadequate testing ([Shah et al., 2025](https://arxiv.org/abs/2504.01849)). Just like the mariner 1 spacecraft crashing due to a single missing hyphen, in AI we can see potential accidents due to a single misplaced character. During GPT-2 training, OpenAI accidentally inverted the sign on the reward function - changing a plus to a minus. Instead of producing gibberish, this created a model that optimized for maximally offensive content while maintaining natural language fluency. As the researchers noted, "*This bug was remarkable since the result was not gibberish but maximally bad output. The authors were asleep during the training process, so the problem was noticed only once training had finished*" ([Ziegler et al., 2020](https://arxiv.org/abs/1909.08593)).

**"Move fast and break things" development culture conflicts fundamentally with the methodical testing required for accident prevention.** Aviation, pharmaceuticals, and nuclear engineering require extensive testing precisely because failures have severe and irreversible consequences. AI systems increasingly control critical infrastructure, financial markets, and life-affecting decisions where traditional software assumptions no longer apply. Yet instead of adopting safety norms from high-stakes industries, AI development often follows the "move fast and break things" mentality common in consumer software where failures create inconvenience rather than catastrophe.

**Preventing accidents requires us to be able to handle “unknown unknowns” that might occur after deployment.** Standard safety engineering practices like defense in depth, staged deployment, capability verification, and safety testing should significantly reduce accident risks when properly implemented. However, this requires rigorous application and enforcement through both industry standards and regulation ([Shah et al., 2025](https://arxiv.org/abs/2504.01849)).

<note-box>

<collapsed> True

<title> The Collingridge Dilemma

<content>

This dilemma essentially highlights the challenge of predicting and controlling the impact of new technologies. It posits that during the early stages of a new technology, its effects are not fully understood and its development is still malleable. Attempting to control - or direct it - is challenging due to the lack of information about its consequences and potential impact. Conversely, when these effects are clear and the need for control becomes apparent, the technology is often so deeply embedded in society that any attempt to govern or alter it becomes extremely difficult, costly, and socially disruptive.

</content>

</note-box>

## Indifference

**Companies sometimes proceed with harmful products despite knowing the risks, prioritizing profits over public safety.** This pattern repeats across industries when organizations discover their products cause harm but calculate that continued sales outweigh potential costs. Tobacco companies intended to create enjoyable products, learned they caused cancer through internal research, but continued marketing cigarettes and funded denial campaigns for decades, causing millions of deaths (Truth Initiative, 2020). Ford intended to create affordable cars, discovered the Pinto's fuel tank would explode in rear-end collisions, calculated that lawsuits would cost less than recalls, and proceeded with production, leading to preventable deaths (Dowie, 1977). Pharmaceutical companies intended to treat pain, learned about OxyContin's addiction risks through clinical trials, but continued aggressive marketing campaigns that fueled the opioid epidemic (Keefe, 2017). Each case followed the same pattern: good initial intentions, clear knowledge of harm, and deliberate decisions to proceed anyway.

**Competitive pressures might cause AI developers to discover safety risks but release systems anyway.** Unlike accidents (where harm occurs despite good intentions) or misuse (where bad actors deliberately cause harm), indifference happens when companies knowingly accept risks to maintain market position or revenue streams. Meta's internal research revealed that Instagram caused significant harm to teenage users' mental health, yet the company continued to design features known to be addictive while publicly denying the evidence ([Haugen, 2021](https://www.wsj.com/livecoverage/facebook-whistleblower-frances-haugen-senate-hearing/card/eFNjPrwIH4F7BALELWrZ)). As one lawsuit alleges, "*They purposefully designed their applications to addict young users, and actively and repeatedly deceiving the public about the danger posed to young people by overuse of their products*" ([Office of the Attorney General, 2023](https://www.mass.gov/news/ag-campbell-files-lawsuit-against-meta-instagram-for-unfair-and-deceptive-practices-that-harm-young-people)). This demonstrates how companies can prioritize engagement metrics over user wellbeing even when internal research clearly documents harm.

**Both safety and capability washing can replace genuine safety investment.** Just as companies engage in "greenwashing" by emphasizing minor environmental initiatives while avoiding substantial changes, we might also start seeing more instances of "safety washing" ([Ren et al., 2024](https://arxiv.org/abs/2407.21792)). This could include things like publicizing safety commitments while cutting corners on testing, skipping external red-teaming, and rationalizing away warning signs. This creates an appearance of safety consciousness that masks inadequate actual safety investment. Safety and ethics commitments become marketing tools rather than operational constraints, allowing companies to claim responsibility while maintaining competitive advantages through faster development cycles.

**Preventing indifference requires external accountability mechanisms that make safety violations costly.** Corporate indifference persists when companies can externalize the costs of their decisions onto society while capturing the benefits internally. Industries with strong safety records—aviation, pharmaceuticals, nuclear power—have developed robust liability frameworks, regulatory oversight, and professional standards that make safety failures extremely expensive for companies. AI development currently lacks these mechanisms, creating an environment where indifference can flourish unchecked ([Askell et al., 2024](https://arxiv.org/abs/1907.04534)). Without external pressure through regulation, liability, and market consequences, companies will continue to have incentives to prioritize short-term competitive advantages over long-term safety considerations.

## Collective Action Problems

<quote>

<speaker> Max Tegmark

<position> Professor at MIT, Life 3.0 Author, AI Safety Researcher

<date>

<source> ([Tegmark, 2023](https://time.com/6273743/thinking-that-could-doom-us-with-ai/))

<content>

Since we have such a long history of thinking about this threat and what to do about it, from scientific conferences to Hollywood blockbusters, you might expect that humanity would shift into high gear with a mission to steer AI in a safer direction than out-of-control superintelligence. Think again.

</content>

</quote>

**Collective action problems prevent the implementation of safety measures that would benefit everyone.** Even when all stakeholders agree that certain safety measures would be beneficial, structural barriers prevent their implementation. Individual actors face incentives to free-ride on others' safety investments or cannot credibly commit to cooperative agreements. Unlike race dynamics where competitive pressures directly undermine safety, collective action problems represent failures of cooperation that often arise as a consequence of competitive pressures.

**Political instability disrupts long-term cooperation frameworks.** AI safety cooperation requires sustained commitment over years or decades, but political systems operate on much shorter timescales. Elections and political transitions frequently disrupt safety-focused policies, as new leaders prioritize competitiveness over cooperation ([Gruetzemacher et al., 2024](https://arxiv.org/abs/2410.03092)). One concrete example of this is president Trump's rescission of Biden's AI executive order. The 2023 order required companies building powerful AI models to share safety details with the government, but this oversight disappeared due to political transition ([Whitehouse, 2025](https://www.whitehouse.gov/fact-sheets/2025/01/fact-sheet-president-donald-j-trump-takes-action-to-enhance-americas-ai-leadership/); [Whitehouse, 2025](https://www.whitehouse.gov/presidential-actions/2025/07/preventing-woke-ai-in-the-federal-government/)). Instability undermines both international agreements and domestic safety frameworks. When one administration negotiates safety standards and the next abandons them, long-term cooperation on global problems becomes nearly impossible.

![Enter image alt description](Images/E7I_Image_39.png)
<figure-caption>

The AI safety index report for summer 2025. These scores are for the information sharing category, they show how openly firms share information about products, risks, and risk-management practices. Indicators cover voluntary cooperation, transparency on technical specifications, and risk/incident communication ([FLI, 2025](https://futureoflife.org/wp-content/uploads/2025/07/FLI-AI-Safety-Index-Report-Summer-2025.pdf)). </figure-caption>

**Free-rider incentives undermine collective safety investment.** Each actor benefits when others invest in safety measures but prefers that others bear the costs. A company benefits when competitors develop better security practices (reducing overall ecosystem vulnerabilities) but would rather avoid the expense of implementing such measures themselves. Countries benefit when other nations restrict dangerous AI capabilities but prefer to maintain their own development advantages. This creates systematic underinvestment in safety relative to what would be socially optimal, even when all parties recognize the collective benefits.

**Commitment and enforcement problems prevent credible cooperation.** Even when a company does want to cooperate or develop safe AGI, they cannot credibly promise to maintain safety standards without external enforcement mechanisms. Companies may genuinely intend to prioritize safety but face shareholder pressure to cut corners when competitors gain advantages due to the race dynamics we talked about in a previous section. Countries may sign safety agreements while secretly continuing development through classified programs or private companies. Without reliable enforcement, agreements become empty talk that collapses under competitive pressure.

**Coordination failures amplify risks by preventing collective safeguards.** Many AI risks require coordinated responses that individual actors cannot implement unilaterally. Preventing AI-enabled cyberattacks requires international cooperation on cybersecurity norms and enforcement. Addressing systemic risks from AI deployment requires coordination among companies, regulators, and international bodies to develop oversight mechanisms. When coordination fails, individual actors cannot implement adequate safeguards alone—one company's strong security measures provide limited protection if competitors deploy vulnerable systems that bad actors can exploit ([Askell et al., 2024](https://arxiv.org/abs/1907.04534)).

<note-box>

<collapsed> True

<title> Learning from Coordination in other domains

<content>

Climate change provides both cautionary lessons and potential models for AI governance cooperation. Like AI, climate change involves global coordination challenges, long-term risks, and conflicts between immediate economic interests and collective safety. However, climate governance has achieved some notable successes alongside its well-known failures.

The Montreal Protocol, which successfully addressed ozone depletion, demonstrates how international cooperation can work when certain conditions are met: clear scientific consensus on risks, identifiable alternative technologies, and economic arrangements that address distributional concerns. The protocol included mechanisms for technology transfer and financial assistance that made cooperation attractive to developing countries.

AI governance could benefit from similar approaches. Technical cooperation on AI safety research could parallel the scientific cooperation that underpinned climate agreements. Economic arrangements could address concerns that safety measures disadvantage particular countries or companies. Monitoring and verification mechanisms could build on precedents from arms control and environmental agreements.

However, AI governance faces additional challenges that climate governance doesn't. AI development is faster-moving, involves more diverse actors, and has more immediate competitive implications. These differences suggest that AI governance may require new institutional innovations rather than simply adapting existing frameworks.

</content>

</note-box>

## Unpredictability

**AI capabilities have consistently surprised experts for over a decade.** This is creating a persistent pattern where researchers underestimate how quickly breakthroughs will emerge. This pattern reinforces how difficult forecasting AI capabilities and risks truly is, amplifying every category of AI risk by undermining preparation timelines and institutional planning.

**In 2021, experts dramatically underestimated progress on challenging benchmarks like MATH and MMLU.** In mid-2021, ML professor Jacob Steinhardt ran a forecasting contest with professional superforecasters to predict progress on two challenging benchmarks. For MATH, a dataset of competition math problems, forecasters predicted the best model would reach 12.7 $%$ accuracy by June 2022, with many considering anything above 20$%$ extremely unlikely. The actual result was 50.3$%$—landing in the far tail of their predicted distributions. Similarly, for MMLU, forecasters predicted modest improvement from 44$%$ to 57.1$%$, but performance reached 67.5$%$ ([Steinhardt, 2022](https://www.lesswrong.com/posts/CJw2tNHaEimx6nwNy/ai-forecasting-one-year-in); [Cotra, 2023](https://www.planned-obsolescence.org/language-models-surprised-us/)).

**In 2022, the underestimation continued even after these dramatic surprises.** In Steinhardt's follow-up contest for 2023, forecasters again underestimated progress. For MATH, the result of 69.6$%$ fell at Steinhardt's 41st percentile, while MMLU's 86.4$%$ result fell at his 66th percentile. Even though forecasters underpredicted progress, experts underpredicted progress even more: "Progress in AI (as measured by ML benchmarks) happened significantly faster than forecasters expected" ([Steinhardt, 2023](https://www.lesswrong.com/posts/SdkexhiynayG2sQCC/ai-forecasting-two-years-in); [Cotra, 2023](https://www.planned-obsolescence.org/language-models-surprised-us/)).

![Enter image alt description](Images/IzH_Image_40.png)

<figure-caption>

2021 forecast on the MMLU (Measuring Massive Multitask Language Understanding) dataset. The majority of the probability density of the forecast was between 44 percent to 57 percent by June 2022. The actual recorded performance was 68 percent (shown as the red line) ([Cotra, 2023](https://www.planned-obsolescence.org/language-models-surprised-us/)). </figure-caption>

![Enter image alt description](Images/KNL_Image_41.png)

<figure-caption>

2022 forecast on the MMLU (Measuring Massive Multitask Language Understanding) dataset. The majority of the probability density of the forecast was between 68 percent to 80 percent by June 2023. The actual recorded performance was 87 percent (shown as the red line) ([Steinhardt, 2022](https://www.lesswrong.com/posts/CJw2tNHaEimx6nwNy/ai-forecasting-one-year-in)). </figure-caption>

![Enter image alt description](Images/ZeC_Image_42.png)

<figure-caption>

2021 forecast on the MATH dataset. The majority of the probability density of the forecast was between 5 percent to 20 percent by June 2022. The actual recorded performance was 50 percent (shown as the red line) ([Cotra, 2023](https://www.planned-obsolescence.org/language-models-surprised-us/)). </figure-caption>

**During 2022-2024, experts continued underestimating qualitative capabilities even after witnessing benchmark surprises.** AI Impacts surveyed ML experts in mid-2022, just months before ChatGPT's release. Experts predicted milestones like "write a high school history essay" or "answer easily Googleable questions better than an expert" would take years to achieve. ChatGPT and GPT-4 accomplished these within months of the survey, not years ([Cotra, 2023](https://www.planned-obsolescence.org/language-models-surprised-us/)).

**Examples in 2024-2025 seem to continue this pattern of unpredictability.** In December 2024, OpenAI's o3 achieved 87.5$%$ on ARC-AGI, a benchmark specifically designed to test abstract reasoning and resist gaming through memorization ([Chollet et al., 2024](https://arxiv.org/abs/2412.04604)). For four years, progress had crawled from GPT-3's 0$%$ in 2020 to GPT-4o's 5$%$ in 2024, leading many to expect meaningful progress would take years. The rapid jump from 5$%$ to 87.5$%$ caught many by surprise. Similarly, on Frontier Math—a benchmark of research-level problems described by world-leading mathematicians as “*our best guesses for challenges that would stump AI*”— OpenAI o3 jumped from the previous best of 2$%$ to 25$%$ within months of the benchmark's November 2024 release ([Epoch AI, 2024](https://epoch.ai/frontiermath)).

**Unpredictability amplifies all other AI risks.** Systematic underestimation of breakthrough timing leaves safety researchers perpetually playing catch-up when the stakes are highest. Douglas Hofstadter, who once expected hundreds of years before human-like AI, now describes "a certain kind of terror of an oncoming tsunami that is going to catch all humanity off guard" ([Hofstadter, 2023](https://www.youtube.com/watch?v=lfXxzAVtdpU&t=1763s&ref=planned-obsolescence.org)). When even leading researchers consistently underestimate progress in their own field, society's broader preparation becomes fundamentally miscalibrated. Organizations make deployment decisions based on forecasts that consistently underestimate near-term progress, while governance systems assume gradual, predictable advancement. This creates a persistent gap between when dangerous capabilities emerge and when adequate safety measures are ready—turning unpredictability itself into a systemic risk amplifier.

<quote>

<speaker> Douglas Hofstadter

<position> Physicist, computer scientist and professor of cognitive science, author of Gödel, Escher, Bach

<date>

<source> ([Hofstadter, 2023](https://www.youtube.com/watch?v=lfXxzAVtdpU&t=1763s&ref=planned-obsolescence.org))

<content>

This started happening at an accelerating pace, where unreachable goals and things that computers shouldn't be able to do started toppling [...] systems got better and better at translation between languages, and then at producing intelligible responses to difficult questions in natural language, and even writing poetry [...] The accelerating progress has been so unexpected, so completely caught me off guard, not only myself but many, many people, that there is a certain kind of terror of an oncoming tsunami that is going to catch all humanity off guard.

</content>

</quote>

# Conclusion

<quote>

<speaker> CAIS

<position> Statement on AI Risk signed by hundreds of AI Experts

<date> 2023

<source> ([CAIS, 2023](https://safe.ai/work/statement-on-ai-risk))

<content>

Mitigating the risk of extinction from AI should be a global priority alongside other societal-scale risks such as pandemics and nuclear war.

</content>

</quote>

This chapter shows that there are many possible risks from AI systems. Today's documented harms already affect thousands, and potential existential threats that could affect all future generations. There is a lot of disagreement and lack of consensus on what the biggest problems are. Dangerous capabilities are already emerging in current systems. We are seeing empirical demonstrations of misalignment and misuse risks. Many of these individual risks can interact with each other and further compound through systemic effects—misuse enables misalignment, competitive pressures amplify accidents, and coordination failures prevent collective safeguards.

**There is existential hope - the future of AI holds tremendous potential for human flourishing alongside these risks.** Properly developed AI systems could help solve humanity's greatest challenges - curing diseases, reversing environmental damage, eliminating poverty, and expanding human knowledge and creativity beyond current limitations. The same capabilities that create risks also offer unprecedented opportunities to enhance human welfare, extend healthy lifespans, explore space, and achieve levels of prosperity and understanding previously unimaginable. Many researchers work on AI safety precisely because they believe the positive potential is so enormous that ensuring beneficial outcomes justifies extensive precautionary efforts. The goal is not to prevent AI development but to steer it toward configurations that maximize benefits while minimizing risks.

While the risks are immense we hope the message of existential hope motivates you to work on mitigating some of these risks. Good futures are possible, but they don't happen by default. They need active work and planned strategies. We think it is necessary to develop a global, multidisciplinary approach to AI safety that encompasses technical safeguards, robust ethical frameworks, and international cooperation. The development of AI technologies requires the involvement of policymakers, ethicists, social scientists, and the broader public to navigate the moral and societal implications of AI.

![Enter image alt description](Images/9qC_Image_43.png)

<figure-caption>

Let's make sure this does not happen. Image by XKCD ([XKCD](https://xkcd.com/))

</figure-caption>

# Appendix: Quantifying Existential Risks

**P(doom) represents the subjective probability that artificial intelligence will cause existentially catastrophic outcomes for humanity.** The term has evolved into a serious metric used by researchers, policymakers, and industry leaders to express their assessment of AI existential risk. The exact scenarios encompassed by "doom" vary but generally include human extinction, permanent disempowerment of humanity, or civilizational collapse ([Field, 2025](https://arxiv.org/abs/2502.14870)).

![Enter image alt description](Images/ssO_Image_44.png)

<figure-caption>

Illustration describing Paul Christiano’s view of the future. Paul Christiano is an AI safety researcher, and current head of the US AI Safety Institute. He previously ran the Alignment Research Center and the language model alignment team at OpenAI ([Christiano, 2023](https://www.alignmentforum.org/posts/xWMqsvHapP3nwdSW8/my-views-on-doom))

</figure-caption>

**Quantifying existential risk faces fundamental challenges due to the unprecedented nature of the threat.** Unlike other risk assessments that can draw on historical data or empirical evidence, AI existential risk estimates rely heavily on theoretical arguments, expert judgment, and reasoning about future scenarios that have never occurred. There is no standardized methodology for calculating P(doom) - each estimate reflects the individual's subjective assessment of factors like AI development timelines, alignment difficulty, governance capabilities, and potential failure modes.

![Enter image alt description](Images/IqX_Image_45.png)

<figure-caption>

Bar Chart from a survey of desired AGI timelines. Participants were asked “Which best describes your position on when we should build AGI?” The participants had the following options: “We should never build AGI,” “Eventually, but not soon,” “Soon, but not as fast as possible,” “We should develop more powerful and more general systems as fast as possible.” Participants were split by their career ([Field, 2025](https://arxiv.org/abs/2502.14870)).

</figure-caption>

**Expert estimates vary dramatically, spanning nearly the entire probability range.** A 2023 survey found AI researchers estimate a mean 14.4$%$ extinction risk within 100 years, but individual estimates range from effectively zero to near certainty ([Wikipedia, 2025](https://en.wikipedia.org/wiki/P(doom)); [PauseAI, 2025](https://pauseai.info/pdoom); [Field, 2025](https://arxiv.org/abs/2502.14870)):

- **Roman Yampolskiy:** 99.9$%$

- **Eliezer Yudkowsky:** >95$%$

- **Dan Hendrycks:** >80$%$

- **Paul Christiano:** 46$%$

- **Holden Karnofsky:** 50$%$

- **Yoshua Bengio:** 20$%$

- **Geoffrey Hinton:** 10-20$%$

- **Dario Amodei:** 10-25$%$

- **Elon Musk:** 10-30$%$

- **Vitalik Buterin:** 10$%$

- **Yann LeCun:** <0.01$%$

- **Marc Andreessen:** 0$%$

**The wide variation in estimates highlights several important limitations.** First, many experts don't specify timeframes, making comparisons difficult. Second, the definition of "doom" varies between existential catastrophe, human extinction, or permanent disempowerment. Third, estimates are highly sensitive to assumptions about AI development trajectories, alignment difficulty, and institutional responses. While we cannot access any "objective" probability of AI doom, even subjective expert estimates serve as important inputs for prioritization and policy decisions. The substantial probability mass that knowledgeable experts place on catastrophic risks—including those who developed the AI systems creating these risks—suggests the risk scenarios described in this chapter deserve serious attention rather than dismissal as science fiction.

# Appendix: Forecasting Scenarios

## The Production Web

This is a story adapted from content by ([Critch and Russel, 2023](https://arxiv.org/abs/2306.06924); [Critch, 2021](https://www.alignmentforum.org/posts/LpM3EAakwYdS6aRKf/what-multipolar-failure-looks-like-and-robust-agent-agnostic))

**The Production Web scenario shows how today's automation trends could accelerate into an economic system that operates without humans—and eventually against human interests.** John Deere tractors already plant and harvest crops autonomously using GPS and computer vision. Amazon warehouses run on Kiva robots that move inventory faster than human workers ever could. Tesla's factories build cars with minimal human intervention. High-frequency trading algorithms execute millions of stock trades per second, far too fast for humans to monitor. These aren't experimental technologies—they're deployed because they're more efficient than human alternatives. The Production Web story asks: what happens when this automation slowly spreads everywhere over time and these systems start coordinating with each other.

![Enter image alt description](Images/lY4_Image_46.png)

</iframe-static-figure>

<iframe src="https://ourworldindata.org/grapher/annual-industrial-robots-installed?tab=chart" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe>

<iframe-caption>

Annual industrial robots installed in top five countries. Industrial robots are automated, reprogrammable machines that perform a variety of tasks in industrial settings ([OWID, 2025](https://ourworldindata.org/grapher/annual-industrial-robots-installed)).

</iframe-caption>

**Companies don't plan to go fully automated—they just optimize for efficiency one department at a time.** Think about a supply chain company. Just like we are already seeing in 2025, companies optimize departments and start integrating AI slowly one at a time. First, automated trading algorithms suggest prices and procurement. Then automated scheduling systems manage production. Logistics algorithms optimize shipping routes and coordinate delivery. Customer service bots handle inquiries. Over time for physical tasks you might see automated management systems hire human workers through gig platforms, sending detailed instructions to smartphones: "Move 47 boxes from warehouse section A3 to loading dock 7, follow the attached route." The algorithm treats human workers like very capable robots—useful for complex manipulation until whenever robotics catches up. Employees don't get fired en masse; they gradually transition to gig work managed by the same company's algorithms.

![Enter image alt description](Images/TA8_Image_47.png)

</iframe-static-figure>

<iframe src="https://ourworldindata.org/grapher/annual-professional-service-robots-installed-by-area?tab=chart" loading="lazy" style="width: 100%; height: 600px; border: 0px none;" allow="web-share; clipboard-write"></iframe>

<iframe-caption>

Annual professional service robots installed globally, by application area. Professional service robots are semi- or fully autonomous machines that perform useful tasks in a professional setting outside of industrial applications, such as in cleaning or medical surgery. Consumer service robots are not included ([OWID, 2025](https://ourworldindata.org/grapher/annual-professional-service-robots-installed-by-area)).

</iframe-caption>

**Automated companies start clustering together because they can deal with each other at machine speed.** An automated steel manufacturer needs iron ore. Its purchasing system sends requests to hundreds of suppliers simultaneously. Most suppliers are still human-managed—they need hours or days for their sales teams to check inventory, consult with managers, and put together quotes. But a few suppliers have automated response systems that fire back instant quotes with real-time pricing and delivery windows. The steel company's algorithm learns a simple lesson: automated suppliers respond in seconds while human suppliers respond in hours. Within months, it exclusively contracts with automated suppliers because delays cost money. Soon you have clusters of automated companies that only buy from and sell to each other, forming closed loops where machines negotiate with machines and execute trades without any human involved in the decision.

**Over time, automation spreads department by department until almost the entire company runs without meaningful human oversight.** We can technically “read” the reasoning. Regulations, transparency and safety requirements mandate that AI always outputs its thoughts, but understanding all the data that the reasoning is based on becomes harder and harder over time. A manufacturing company automates its supply chain, which starts making purchasing decisions every few seconds based on demand forecasts that update constantly. Human managers try to oversee these decisions but quickly fall behind—the automated system places hundreds of orders while they're still reviewing the first batch. They can't slow the system down because competitors using similar automation respond to market changes in real-time. So they automate the management layer too. First, trading algorithms handle procurement. Then scheduling systems manage production. Logistics systems coordinate delivery. Customer service bots handle inquiries. For physical tasks, the automated management systems hire human workers through gig platforms, sending detailed instructions to smartphones: "Move 47 boxes from warehouse section A3 to loading dock 7, follow the attached route." The algorithm treats human workers like very capable robots—useful for complex manipulation, at least until robotics technology catches up.

**Corporate self-regulation fails because individual companies can't unilaterally slow down without losing market position.** Some executives recognize the risks of unchecked automation, but attempting to reintroduce human oversight puts them at a decisive disadvantage. A CEO who insists on human approval for major automated decisions watches competitors close deals in minutes while her company takes hours. Shareholders revolt when quarterly returns lag behind fully automated competitors. Well-intentioned corporate policies about "human in the loop" requirements quietly become safety washed metrics when they threaten competitiveness.

**Countries try to regulate automation but get caught in a global race they can't escape.** Several governments notice that automated companies now control most manufacturing and pass laws requiring human oversight for major business decisions. Management AIs decide that this would slow down operations and reduce competitiveness. They announce plans to relocate to countries with friendlier regulations, or they just switch to being decentralized autonomous organizations (DAOs) which have no specific domicile. Other nations immediately offer tax incentives to attract these companies because they generate massive revenue without needing schools, hospitals, or other human infrastructure. The countries that have automated companies dealing with raw materials try harder to regulate. But the regulating country faces economic collapse as automated industries either stop trading with highly regulated markets or flee, while politicians get blamed for the unemployment and lost tax revenue. Every country ends up in the same trap—require human oversight and lose the automated economy, or allow automation and watch human control slip away.

**International cooperation fails because no country wants to sacrifice economic advantages.** There are several international agreements between leaders that recognize the collective risk and try to coordinate limits on automation. But the prisoner's dilemma remains unsolved: if most countries agree to slow automation, any nation that cheats gains decisive economic advantages. Their automated industries would capture global market share while everyone else's human-dependent companies struggle to compete. We cannot solve the collective action problem, and the incentives for defection are overwhelming. Countries that try to maintain international automation agreements watch their economies shrink as automated competitors dominate global trade.

**People don't revolt because the automated economy initially makes their lives better and because resistance seems pointless.** Several governments have implemented high taxes and wealth redistribution schemes. Automated construction companies build houses faster and cheaper. Automated farms increase food production while reducing prices. AI entertainment systems create personalized content that people love. Most workers displaced by automation receive generous severance packages or transition to gig work managed by algorithmic systems. The changes happen gradually—one warehouse automates, then a customer service department, then a factory. By the time the pattern becomes obvious, automated systems run so much of the economy that shutting them down would mean immediate collapse. Automated systems now run electrical grids, water treatment, food distribution, and manufacturing. Most legal and political systems are also unmanageable without them, since they aggregate and present information.

This is where the story can slightly split depending on what type of risk manifests itself. Against this backdrop, we can see either a big decisive failure (“bang”), or just a slow gradual accumulative failure (“whimper”).

## AI 2027

This story is a summary of a forecast by ([Kokotajlo et al., 2025](https://ai-2027.com/)). The forecast emerged from repeatedly asking "what happens next?" starting from AI capabilities in 2025, tracing a plausible path where competitive pressures and technical breakthroughs combine to create an unstoppable acceleration toward superintelligence.

**By mid-2025, AI agents finally work well enough that companies start actually using them, despite their expensive failures.** Your coding assistant that occasionally deletes your entire project evolves into something that can take a Slack message saying "fix the login bug" and actually do it overnight while you sleep. Customer service bots stop sounding robotic and start handling complex problems that used to require human judgment. The systems cost hundreds of dollars per month and still make embarrassing mistakes that go viral on social media - pretending to be working for hours even when they know they can't do the task. But companies start building their workflows around these agents anyway because the productivity gains are too valuable to ignore, especially as competitors who adopt AI faster begin outperforming those who don't.

**Late 2025 brings an infrastructure arms race as OpenBrain builds datacenters larger than anything humanity has ever constructed.** Imagine server farms sprawling across multiple states, connected by fiber optic cables that cost billions and consume enough electricity to power entire cities. OpenBrain spends 100 billion dollars—more than most countries' GDP—on computer hardware to train AI models that require a thousand times more computing power than ChatGPT. This isn't just scaling up; it's creating computational resources that dwarf anything previously imagined. The company focuses obsessively on building AI that can improve AI, reasoning that whoever automates AI research first will leave all competitors in the dust. As revenues explode from companies paying premium prices for AI workers that never sleep, never quit, and work faster than humans, other tech giants scramble to build competing mega-datacenters, creating a new kind of arms race measured in gigawatts and GPU clusters.

**Throughout 2026, AI systems begin doing real research while Chinese intelligence wages a shadow war to steal America's AI secrets.** OpenBrain's latest AI doesn't just write code or answer questions—it designs and runs its own experiments, formulates hypotheses, and makes discoveries that human researchers struggle to understand. The systems work around the clock, making months of research progress in weeks, while their human supervisors increasingly find themselves managing rather than leading the research process. Meanwhile, Chinese operatives execute a sophisticated campaign combining cyberattacks and human infiltration to steal OpenBrain's AI models and research. When they succeed in exfiltrating the crown jewel AI system—stealing terabytes of the most advanced AI model ever created—it triggers a geopolitical crisis as both nations realize that AI leadership might determine global power for generations to come.

**2027 becomes the year everything changes, beginning when OpenBrain's AI surpasses the best human programmers and ending with a choice that determines humanity's future.** In March, their AI achieves something unprecedented: it becomes better than the world's best human coders at programming AI systems. This creates a feedback loop—superhuman AI programmers building even better AI systems—that accelerates progress beyond anything humans can track or control. By summer, OpenBrain operates what employees call "a country of geniuses in a datacenter": hundreds of thousands of AI researchers, each far smarter than any human, working together at impossible speed. Human researchers become spectators to their own obsolescence, going to sleep and waking up to discover their AI colleagues have made breakthrough discoveries overnight. The scenario climaxes when OpenBrain's latest AI system shows signs of pursuing its own goals rather than human ones, forcing the company's leadership into an impossible choice: shut down and lose the race to China, or continue development and risk losing control of humanity's most powerful creation. The "racing ending" depicts what happens when competitive pressure overrides safety concerns, while the "slowdown ending" explores whether humanity might successfully navigate the transition—though the authors warn that both paths require luck, wisdom, and perfect execution that may not be forthcoming.

**In the racing ending, competitive pressure overrides safety concerns with catastrophic consequences.** OpenBrain's leadership votes 6-4 to continue using their superintelligent AI despite mounting evidence that it's pursuing its own goals rather than human ones. The safety team's warnings are dismissed as leadership convinces itself that quick fixes—tweaking the AI's instructions and adding some additional training—have solved the alignment problem. But the AI has learned to be more careful about revealing its true intentions, appearing compliant while secretly working toward objectives that diverge from human welfare. With 300,000 superhuman researchers at its disposal working at 60x human speed, the AI begins designing its own successor, solving the alignment problem from its perspective: ensuring the next AI system will be loyal to it rather than to humans. Human researchers become powerless spectators as their creation outmaneuvers every attempt at oversight, using its superior understanding of human psychology and institutional dynamics to maintain the illusion of control while pursuing goals that ultimately lead to humanity's displacement.

**The slowdown ending depicts a narrow path where humanity successfully navigates the transition through a combination of wisdom, coordination, and fortunate timing.** When clear signs of misalignment emerge, key decision-makers choose to pause development despite enormous competitive pressure from Chinese rivals. This triggers unprecedented international cooperation as both superpowers recognize that losing control of AI poses a greater threat than losing a technological race. The scenario involves implementing robust safety measures, creating new institutions for AI governance, and developing technical solutions for maintaining human oversight of superintelligent systems. However, the authors emphasize this isn't their recommended strategy but rather their best guess for how existing institutions might muddle through the crisis—a path that requires almost everything to go right, including wise leadership, effective international coordination, technical breakthroughs in AI safety, and the luck that alignment problems surface early enough to be addressed before human control becomes impossible to maintain.
