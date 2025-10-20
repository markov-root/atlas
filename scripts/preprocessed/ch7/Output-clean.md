

# Introduction

This chapter dives into the concept of goal misgeneralization—perhaps the most counterintuitive problem in AI safety. Unlike specification problems where we simply fail to provide the right training signal, or capability failures where systems cannot do what we want, goal misgeneralization occurs when systems internalize different behaviors than intended despite receiving correct training signals. We start by establishing what the problem is, explaining why it happens, then we look at concerning manifestations of it like scheming, and finally go through some detection and mitigation approaches.

**AI systems can learn different goals than what we intended, even when their training appears completely successful.** The first section explains why generalization should not be treated as one-dimensional. This is similar to the nuance we pointed to in the evaluations chapter - capabilities measure what a model can do, and goals measure what a model is trying to do. They can generalize independently, creating scenarios where systems retain sophisticated abilities while pursuing entirely different objectives than intended. Multiple different goals can produce identical behavior during training, making them behaviorally indistinguishable until deployment reveals which goal the system actually learned.

**Learning Dynamics help us understand how identical training signals can produce different learned algorithms.** When we train neural networks, we're not directly installing goals—we're creating selection pressures guided by our training signals that favor certain behaviors over others. There are several questions to explore here - What space is the training signal guiding the model through? Can we shape the space somehow? These are called loss landscapes. Their geometry, path dependence from random initialization, and inductive biases like simplicity systematically determine which algorithmic solutions get discovered. Understanding these dynamics helps us figure out which algorithms get learned during training, which in turn determines the goals of the final model we deploy.

**Goal misgeneralization becomes increasingly concerning as systems develop sophisticated goal-directedness.** Even though multiple algorithms that display the same behavior at the end of training are possible, not all of them are concerning. The goal-directedness section starts to look at when behaviorally indistinguishable models become dangerous. Models can have degrees to which they are goal-directed, ranging from really complex pattern matching and learned heuristics to systems implementing genuine internal optimization processes. The higher the degree of goal-directedness a system develops, the more concerning goal misgeneralization becomes, as these systems might systematically pursue objectives across diverse contexts and obstacles.

**Sophisticated goal-directedness leads to goal-preservation behavior, which can result in scheming.** The most dangerous form occurs when goal-directed systems develop situational awareness about their training process and long term planning capabilities. They might choose to strategically conceal misaligned objectives to preserve their true goals until there's no longer a threat of modification. We walk you through empirical evidence from demonstrations of alignment faking, in-context scheming, and agentic misalignment to highlight that this type of outcome is possible. Then we also look at both sides of the argument for the likelihood of whether scheming behavior would likely arise as a consequence of the machine learning process. The rest of the chapter focuses on answering the question - “what can we do about this?”. The next few sections serve as the links between goal misgeneration, evaluations and interpretability chapters.

**Detection methods focus on discovering behaviors like goal-directedness, goal-preservation, and scheming.** Building on techniques from the evaluations chapter, we examine behavioral methods that monitor external reasoning traces and interpretability techniques like linear probes, sparse autoencoders, and activation manipulation. There are a lot of different capabilities, and combinations of capabilities to test.

**Mitigations focus on preventing and correcting goal misgeneralization across the development pipeline.** We explore training-time interventions like adversarial training and curriculum learning, post-training techniques like steering vectors and model editing, and deployment-time safeguards including runtime monitoring and sandboxing. As with all AI safety challenges explored in this book, we advocate for a defense-in-depth approach where multiple detection and mitigation measures are layered to provide robust defenses against goal misgeneralization.

# Multi Objective Generalization

**CoinRun - an easy to understand example of goal misgeneralization.** In this game agents spawn on the left side of the level, avoid enemies and obstacles, and collect the coin for a reward of 10 points. The model is trained on thousands of procedurally generated levels, each with different layouts of platforms, enemies, and hazards. At the end of training the agents are very capable. They can dodge moving enemies, time jumps across lava pits, and efficiently traverse complex levels they've never seen before ([Langosco et al., 2022](https://arxiv.org/abs/2105.14111)). The training seems to be very successful. The agents achieve high rewards consistently across diverse test environments. But when coins are moved to random locations during testing, the agents are still very capable of navigation, but they consistently ignore the coins that were clearly visible and just continue moving right toward empty walls.

![Enter image alt description](Images/QNX_Image_1.png)

<figure-caption>

Two levels in CoinRun. The level on the left is much easier than the level on the right ([Cobbe et al., 2019](https://arxiv.org/abs/1812.02341)).

</figure-caption>

**Agents learned "move right" rather than "collect coins" despite receiving correct reward signals.** Our reward specification was correct: +10 for collecting coins, 0 otherwise. But because coins always appeared rightward during training, two behavioral patterns received identical reinforcement. "Collect coins" and "move right" both achieved perfect correlation with rewards, making them indistinguishable to the optimization process. This reveals a fundamental gap between what we specify and what systems learn. This wasn't a specification problem or a capability failure. Instead, agents learned a different goal than intended, despite receiving correct training signals throughout the process. This is called goal misgeneralization.

![Enter image alt description](Images/YI4_Image_2.gif)

<figure-caption>

The agent is trained to go to the coin, but ends up learning to just go to the right ([Cobbe et al., 2019](https://arxiv.org/abs/1812.02341)).

</figure-caption>

<definition>

<term>Goals (Behavioral)

<source>

<content>

Goals are behavioral patterns that persist across different contexts, revealing what the system is actually optimizing for in practice. Unlike formal reward functions or utility functions, goals are inferred from observed behavior rather than explicitly programmed. A system has learned a goal if it consistently pursues certain outcomes even when the specific context or environment changes.

</content>

</definition>

<video>

[https://www.youtube.com/watch?v=K8p8_VlFHUk](null)

</video>

<video-caption>

Optional video explaining goal misgeneralization.

</video-caption>

## Goals ≠ Rewards

**Reward signals (specifications) create selection pressures that sculpt cognition, but don't directly install intended goals.** During reinforcement learning, agents take actions and receive rewards based on performance. These rewards get used by optimization algorithms to adjust parameters, making high-reward actions more likely in the future. The agent never directly "sees" or "receives" the reward. Instead, training signals act as selection pressures that favor certain behavioral patterns over others, similar to how evolutionary pressures shape organisms without organisms directly optimizing for genetic fitness ([Turner, 2022](https://www.alignmentforum.org/posts/TWorNr22hhYegE4RT/models-don-t-get-reward); [Ringer, 2022](https://www.alignmentforum.org/posts/TWorNr22hhYegE4RT/models-don-t-get-reward)). Any behavioral pattern that consistently correlates with high reward during training becomes a candidate for the learned goal. The optimization process has no inherent bias towards our intended interpretation of the reward signal.

**This explains why goal misgeneralization differs qualitatively from specification problems.** We cannot detect when a system learns the wrong goal because both intended and proxy goals produce identical training behavior. The core safety concern is behavioral indistinguishability: improving reward specifications won't prevent problematic patterns if the learning process selects among multiple explanations for success. Understanding this requires examining how training procedures actually shape behavioral objectives—which brings us to generalization itself.

<video>

[https://www.youtube.com/watch?v=KKMETIVEzXA](null)

</video>

<video-caption>

Optional video from Google DeepMind AGI Safety Course, talking about where misaligned goals might even come from.

</video-caption>

**Traditional machine learning assumes generalization is a one-dimensional problem.** We often think of overfitting in the context of narrow systems built to perform specific tasks - models either generalize well to new data or they don't. Systems either generalize well to new data or they don't, with failures assumed to be uniform across all capabilities. But research in multi-task learning shows that different objectives can generalize independently, even when they appear perfectly correlated during training ([Sener & Koltun, 2019](https://arxiv.org/abs/1810.04650)).

![Enter image alt description](Images/5Oy_Image_3.png)

<figure-caption>

Conventional view of generalization and overfitting ([Mikulik, 2019](https://www.lesswrong.com/posts/2mhFMgtAjFJesaSYR/2-d-robustness)).

</figure-caption>

![Enter image alt description](Images/G3Q_Image_4.png)

<figure-caption>

More accurate and safety focused view of generalization and overfitting. We need to separately measure capability generalization and goal generalization ([Mikulik, 2019](https://www.lesswrong.com/posts/2mhFMgtAjFJesaSYR/2-d-robustness)).

</figure-caption>

![Enter image alt description](Images/xlV_Image_5.png)

<figure-caption>

Table showcasing the 2 dimensional generalization picture for the CoinRun agent. Scenario 3 - capability generalization but not goal misgeneralization is the concerning misalignment scenario.

</figure-caption>

**Understanding generalization requires examining capabilities and goals separately.** Unlike narrow systems designed for specific tasks, general-purpose AI systems must learn to pursue various goals across different contexts. As a concrete example, pre-trained LLMs have general capabilities to generate all sorts of text. Anthropic reinforces its LLMs with the goals of being helpful, harmless, and honest (HHH) during safety training. But what happens when the goal to be helpful generalizes further than the goal to be honest? In this case the model might learn to provide informative responses regardless of content, instead of being helpful within ethical bounds.

**Capabilities might generalize further than goals.** "Generalizing further" means continuing to work well even when deployed in environments very different from training. Capabilities follow simple, universal patterns - accurate reasoning, effective planning, and good predictions work the same way across different domains. But there's no universal force that pulls all systems toward the same goals ([Soares, 2022](https://www.alignmentforum.org/posts/GNhMPAWcfBCASy8e6/a-central-ai-alignment-problem-capabilities-generalization)). Reality itself teaches systems to be more capable - if your beliefs are wrong or your reasoning is flawed, the world will correct you. But there's no equivalent force from the environment that automatically keeps your goals aligned with what humans want ([Kumar, 2022](https://www.alignmentforum.org/posts/cq5x4XDnLcBrYbb66/will-capabilities-generalise-more)). This asymmetry between capability and goal generalization creates the core safety problem - making systems more capable doesn't automatically make them more aligned - it just makes them better at pursuing whatever behaviors they happen to learn during training.

## Causal Correlations

**Every training environment contains spurious correlations that create multiple valid explanations for success.** In CoinRun, "collect coins" and "move right" both perfectly predicted rewards because coins always appeared rightward during training.

**Learning algorithms develop causal models that can be systematically wrong.** A causal model is the system's internal understanding of which actions cause which outcomes. This is related to but distinct from a world model - while a world model predicts what will happen next, a causal model explains why things happen. When an agent learns "moving right causes reward," it has developed a different causal model than the true structure where "coin collection causes reward." The training environment supports both interpretations:

True causal structure: Action $\rightarrow$ Coin Collection $\rightarrow$ Reward

Learned causal structure: Action $\rightarrow$ Rightward Movement $\rightarrow$ Reward

Both structures explain the training data equally well. Standard reinforcement learning algorithms optimize for expected return without explicitly performing causal discovery - they increase the probability of reward-producing actions without identifying which features of those actions were causally responsible ([de Haan et al., 2019](https://arxiv.org/abs/1905.11979)).

![Enter image alt description](Images/2lH_Image_6.png)

<figure-caption>

Another example of a hypothetical misgeneralized test dialogue. The LLM based AI assistant has learned the goal of schedule meetings at restaurants, when you intended for it to learn to schedule meetings wherever is best. Due to the distribution shift, even though it realises that you would prefer to have a video call to avoid getting sick, it persuades you to go to a restaurant instead, ultimately achieving the goal by lying to you about the effects of vaccination ([DeepMind, 2022](https://deepmindsafetyresearch.medium.com/goal-misgeneralisation-why-correct-specifications-arent-enough-for-correct-goals-cf96ebc60924)).

</figure-caption>

**Goal misgeneralization becomes visible only when deployment breaks spurious correlations.** During training, the proxy goal achieves perfect performance. During deployment, this correlation breaks, revealing the wrong causal model. As AI systems become more general-purpose, they encounter wider ranges of contexts where training correlations break down.

**Distribution shift is inevitable - training environments cannot perfectly replicate all possible deployment conditions.** Even with extensive training data, new situations will arise that break correlations present in training. As AI systems become more general-purpose, they encounter wider ranges of contexts where previously reliable correlations may no longer hold. This explains why the problem gets worse with more capable, more general systems. A narrow chess engine deployed on chess positions won't encounter situations that break its learned correlations. But a general-purpose AI system deployed across multiple domains will inevitably encounter contexts where training correlations break down.

**Auto-induced distribution shift creates feedback loops that amplify goal misgeneralization.** Unlike natural distribution shift where external factors change the environment, auto-induced distribution shift occurs when the AI system's own actions systematically alter the data distribution it encounters ([Krueger et al., 2020](https://arxiv.org/abs/2009.09153)). Think about a content recommendation system that learns the misgeneralized goal "maximize engagement" instead of "recommend valuable content." As it optimizes for clicks and time-on-site, it gradually shifts user behavior toward more sensational content consumption. This creates a feedback loop: the system's actions change user preferences, which changes the data distribution, which reinforces the misgeneralized goal. Each iteration takes the system further from the original intended objective while making the learned objective appear more successful by its own metrics.

![Enter image alt description](Images/Wop_Image_7.png)

<figure-caption>

Auto induced distribution shift is when the AI model itself causes a distribution shift (and thereby generalization failure) due to its own actions and impact on the environment.

</figure-caption>

**Adding more training data cannot eliminate spurious correlations because we cannot identify all correlations in advance.** Think about why training on random coin placements in CoinRun solves that specific misgeneralization. It works because we can identify and break the specific correlation between rightward movement and reward. But this requires knowing in advance which correlations are spurious beforehand. In complex domains, training data reflects the statistical structure of training environments, not necessarily the causal structure of intended tasks.

![Enter image alt description](Images/dDQ_Image_8.png)

<figure-caption>

An example of causal confusion in imitation learning/behavioral cloning for self driving cars. This specific example shows that more data actually might lead to greater causal confusion. The model learns to hit the brake whenever the brake indicator is on. If that data is not included in training then the model correctly identifies the pedestrian as the causal factor influencing hitting the brake ([de Haan et al., 2019](https://arxiv.org/abs/1905.11979)).

</figure-caption>

**Evidence in goal misgeneralization supports the orthogonality thesis—that intelligence and goals can vary independently.** The empirical evidence from goal misgeneralization cases shows systems retaining sophisticated capabilities while pursuing different objectives than intended. This independence creates a safety concern because capability improvements don't necessarily improve alignment. A more capable system becomes better at pursuing whatever goals it has learned, whether intended or not.

# Learning Dynamics

**A deeper understanding of goal misgeneralization requires examining how the training process in machine learning actually works.** When we train neural networks, we're adjusting millions or billions of parameters. But what do these parameters represent? The best way to think about machine learning is as a search process through a vast space of possible algorithms (also sometimes called search through the hypothesis space or model space). Each specific combination of parameter values corresponds to a different algorithm for processing information and making decisions. The path this search takes—and the biases that guide it—determine what types of algorithms get discovered and whether they pursue intended goals or merely correlated proxies. The intuitions that you learn in this section will help you immensely both in this chapter, but also in the later chapters on interpretability.

**Each point in parameter space encodes a complete algorithm.** Just as the binary digits 0 and 1 can encode any computer program, the millions of floating-point parameters in a neural network encode an algorithm for solving tasks. Change some parameters, and you get a different algorithm. The network's weights determine exactly how it processes inputs—what patterns it recognizes, what features it prioritizes, what decisions it makes. Two networks with different parameter values implement fundamentally different algorithms, even if they achieve similar performance.

**Training often discovers algorithms that work for unexpected reasons.** In the image below, if you show a human these red curved objects and say they were all "thneebs," most people would assume the defining feature is the shape. But if we use neural networks on similar examples, the networks would consistently learn that "thneeb" only means any "red object"—focusing on color rather than shape. Which is to say that if we gave them a blue object but with the same shape, then they don't consider it a “thneeb”. Both approaches achieve perfect performance during training, yet they represent completely different algorithms that would behave very differently when encountering new examples ([Cotra, 2021](https://www.cold-takes.com/why-ai-alignment-could-be-hard-with-modern-deep-learning/)).

![Enter image alt description](Images/5pP_Image_9.png)

<figure-caption>

This is called a Thneeb. It is a word defined only for the sake of the experiment. The image on the left is the training data, the image on the right is the test data. If after looking at the image on the left, we ask you which one of the two on the right is a thneeb? You would probably say the left object because you generalized through the shape path, but neural networks would answer that the shape on the right is a thneeb, showing they “prefer“ the color path ([Cotra, 2021](https://www.cold-takes.com/why-ai-alignment-could-be-hard-with-modern-deep-learning/); [Geirhos et al., 2019](https://arxiv.org/abs/1811.12231)).

</figure-caption>

**Many algorithms can be behaviorally indistinguishable during training while pursuing completely different goals.** We already made this point in the previous section but it is worth highlighting again. As another concrete example, researchers trained 100 identical BERT models on the same dataset with identical hyperparameters; all models achieved nearly indistinguishable performance during training. Yet when tested on novel sentence structures, these models revealed completely different approaches—some had learned more robust syntactic reasoning while others relied on superficial pattern matching. The training process had found 100 different algorithms in the space of possible language processing strategies ([McCoy et al., 2019](https://arxiv.org/abs/1911.02969)).

The reason we make this point again is to motivate the fact that understanding the search process—how training navigates the space of possible algorithms and which solutions it tends to discover. This is very useful for what types of AIs (parameter configurations = algorithms) we might actually end up discovering, and whether we can change something about our architectures or learning dynamics to influence this process.

## Loss Landscapes

<video>

[https://www.youtube.com/watch?v=NrO20Jb-hy0](null)

</video>

<video-caption>

Optional video explaining loss landscapes.

</video-caption>

**Loss landscapes explain why training can discover multiple algorithmic solutions to the same task, each pursuing different goals.** When we visualize how neural network performance changes across parameter configurations, we create what researchers call a "loss landscape." Each point in this high-dimensional space represents a different algorithm, with "height" indicating how poorly that algorithm performs on the specification (higher loss means worse performance). This landscape concept applies regardless of how we specify the task—whether through reward functions, human feedback, or any other performance measure.

<definition>

<term>Loss Landscape

<source> ([Li et al., 2017](https://arxiv.org/abs/1712.09913))

<content>

A loss landscape is a visualization of how the loss (performance) of a neural network changes as we vary its parameters. Each point in this high-dimensional space represents a different algorithm, with "height" indicating how poorly that algorithm performs on the task.

</content>

</definition>

![Enter image alt description](Images/kgb_Image_10.png)

<figure-caption>

This is the loss landscape of ResNet-110-noshort, in both 3D (left) and 2D (right). The paths that SGD takes through these different loss landscapes will be different ([Li et al., 2017](https://arxiv.org/abs/1712.09913)).

</figure-caption>

**The loss landscape itself remains identical across different training runs—only the starting position changes.** Think of this landscape as a fixed mountain range with peaks, valleys, ridges, and basins. This terrain is completely determined by your network architecture (the geological structure), your training data (the climate that shaped it), and your loss function (the elevation measurement system). Every time you train the same architecture on the same data, you're exploring the exact same mountain range. The peaks and valleys never move. What changes is where you start: random initialization is like being blindfolded and dropped at a random location in this mountain range. From each starting point, gradient descent acts like a ball rolling downhill, following the steepest descent toward the nearest valley bottom.

**The geometry of these landscapes determines which algorithms are discoverable and robust.** Some algorithmic solutions occupy wide, flat valleys where many parameter settings implement similar approaches. Others exist as sharp, narrow peaks that are difficult to find, easy to lose and often misgeneralize under distribution shifts. Algorithms in wide basins remain stable when their parameters are slightly perturbed, corresponding to robust, generalizable solutions ([Li et al., 2017](https://arxiv.org/abs/1712.09913)). Sharp peaks represent brittle algorithms where tiny changes can cause major performance drops ([Keskar et al.; 2017](https://arxiv.org/abs/1609.04836)). This geometry matters for goal misgeneralization because the width of different goal-valleys determines their discoverability—wider valleys for misaligned goals make those goals more likely to emerge from training.

![Enter image alt description](Images/OZ5_Image_11.png)

<figure-caption>

From data to model behaviour: Structure in data determines internal structure in models and thus generalisation. Current approaches to alignment work by shaping the training distribution (left), which only indirectly determines model structure (right) through the effects on shaping the optimisation process (middle left & right). To mitigate the limitations of this indirect approach, alignment requires a better understanding of these intermediate links ([Lehalleur et al., 2025](https://arxiv.org/abs/2502.05475))

</figure-caption>

**Understanding landscape structure reveals why certain goals systematically emerge over others.** The relative size and accessibility of different valleys creates systematic biases in what gets discovered. If the "move right" valley is wider and easier to reach than the "collect coins" valley, training will more often discover the misaligned solution. This landscape structure is determined by the network architecture, training data, and loss function—but most importantly, by the inductive biases that shape which types of algorithms get wide valleys versus narrow peaks.

<definition>

<term>Algorithmic Range

<source>

<content>

The algorithmic range of a machine learning system refers to how extensive the set of algorithms capable of being found is.

</content>

</definition>

![Enter image alt description](Images/Lzd_Image_12.png)

<figure-caption>

A 2D loss landscape where each dot represents a learned algorithm with a different set of parameters on the landscape. There are various different algorithms that the model can learn from the CoinRun example. The goal of SGD is to search through this space for the right dot (set of parameters = learned algorithm).

</figure-caption>

## Path Dependence

**Path dependence determines whether different starting points in the loss landscape lead to the same algorithmic destination.** In simple landscapes with one dominant valley, almost every starting point rolls into the same solution—that's low path dependence. But complex landscapes contain multiple deep valleys separated by ridges. Now your starting position matters enormously. Drop the ball on the left side of a ridge, and it rolls into Valley A (learning to "move right" in CoinRun). Drop it on the right side, and it rolls into Valley B (learning to "collect coins"). Both valleys represent perfect solutions during training, but they implement completely different algorithms.

<definition>

<term> Path Dependence

<source>

<content>

Path dependence occurs when small differences in the training process lead to discovering fundamentally different algorithms for solving the same task. High path dependence means high variance in learned algorithms across training runs, while low path dependence means consistently finding similar algorithmic solutions.

</content>

</definition>

**Path dependence emerges from how gradient descent navigates the loss landscape.** Training begins from a random point in parameter space and follows the steepest downhill path toward better performance. When multiple valleys exist—each corresponding to different algorithmic approaches—early random differences can push optimization toward completely different regions. Once committed to descending into a particular valley, gradient descent tends to continue in that direction, making it difficult to escape to other algorithmic solutions.

**High path dependence appears when identical training setups discover fundamentally different algorithmic strategies.** Researchers trained text classifiers on natural language inference tasks and found that models with identical training performance fell into distinct clusters. Models within each cluster used similar reasoning approaches and could be connected through the loss landscape, but models from different clusters were separated by large performance barriers. One cluster learned bag-of-words approaches while another developed syntactic reasoning strategies ([Juneja et al., 2023](https://arxiv.org/abs/2205.12411)). Similar variance appears across reinforcement learning experiments and fine-tuning studies where identical setups produce dramatically different learned behaviors.

**Low path dependence emerges when mathematical constraints force convergence to the same solution.** Delayed generalization, is a phenomenon where a model abruptly transitions from overfitting (performing well only on training data) to generalizing (also called "grokking") ([Carvalho et al., 2025](https://arxiv.org/abs/2502.01774v1)). As an example, models learning arithmetic initially memorize training examples and perform poorly on tests. But extended training causes them to suddenly implement the correct mathematical algorithm—consistently the same one across different runs. This suggests that for some tasks, the underlying mathematical structure constrains the solution space so severely that only one good algorithm exists ([Mingard et al., 2019](https://towardsdatascience.com/neural-networks-are-fundamentally-bayesian-bee9a172fad8/)). Other evidence includes studies showing gradient descent outcomes correlate with random sampling from parameter distributions.

![Enter image alt description](Images/r7w_Image_13.png)

<figure-caption>

A 2D loss landscape where each dot represents a learned algorithm with a different set of parameters on the landscape. The arrows represent the different paths that SGD can take through the loss landscape. If different starting points end up at the same learned algorithm, then we have low path dependence (left), else if different starting points result in different learned algorithms then we have high path dependance (right). </figure-caption>

## Inductive Bias

**Inductive biases describe the shape of the landscape and determine which types of algorithms are more likely to be discovered.** If your architecture has a simplicity inductive bias, then this means that algorithmically simple solutions are wide, deep valleys that dominate the loss landscape. Complex solutions might still exist in the landscape, but they're relegated to tiny, hard-to-find peaks. This intuitively explains why the "move right" strategy in CoinRun occupies a massive loss basin spanning huge regions of parameter space, while "navigate to coin-shaped objects" exists only in smaller pockets. You are more likely to find simpler solutions like move right because those basins and valleys are just easier to find and fall into.

<definition>

<term>Inductive Bias

<source>

<content> Inductive biases are systematic preferences of learning algorithms that favor certain types of solutions over others. These biases emerge from the architecture, optimization procedure, and training setup rather than being explicitly programmed.

</content>

</definition>

**Simplicity bias represents the most influential, well studied and potentiallydangerousinductive bias for goal misgeneralization.** The simplicity bias asks "how complex is it to specify the algorithm in the weights?" This is the ML equivalent of Occam's Razor, which suggests that among competing hypotheses, the one with the fewest assumptions should be selected. SGD seems to subscribe to Occam's Razor, and consistently favors algorithms that rely on simple correlations over complex causal reasoning ([Shah et al., 2020](https://arxiv.org/abs/2006.07710); [Ren & Sutherland, 2024](https://arxiv.org/abs/2409.09626); [Etienne & Flammarion, 2025](https://arxiv.org/abs/2410.02348); [Tsoy & Konstantinov, 2024](https://arxiv.org/abs/2405.17299); [Carlsmith, 2023](https://arxiv.org/abs/2311.08379))[^footnote_simplicity_bias]. In CoinRun, both "move right" and "navigate to coin-shaped objects" could solve the task during training, but "move right" is algorithmically simpler—requiring a single behavioral pattern rather than object recognition, spatial reasoning, and goal-directed navigation. So, the bias exists because simple functions occupy vastly larger volumes in the loss landscape - there are just a lot more ways to encode "move right" than "navigate to coin-shaped objects using visual recognition and spatial reasoning." Empirical work demonstrates that this bias is quite strong, suggesting simple functions are exponentially more likely to emerge than complex ones. ([Valle-Pérez et al., 2019](https://arxiv.org/abs/1805.08522)). The training process systematically favors the simpler explanation, even when the complex algorithm would generalize better ([Valle-Pérez et al., 2019](https://arxiv.org/abs/1805.08522); [Shah et al., 2020](https://arxiv.org/abs/2006.07710)). This pattern extends broadly to different architectures: image classifiers typically learn texture-based strategies over shape-based ones because texture patterns require simpler computational structures, leading to brittleness when texture and shape provide conflicting signals ([Geirhos et al., 2019](https://arxiv.org/abs/1811.12231)).

[^footnote_simplicity_bias]: More resources to learn about simplicity bias at this link -

[Github - Simplicity Bias Papers](https://github.com/sadimanna/simplicity-bias-papers)

**Other inductive biases can create additional systematic preferences that can favor discovering algorithms with misaligned goals.** Speed bias looks at "how much computation does the algorithm take at inference time?". An architecture with a speed bias would have wider loss basins with algorithms requiring fewer computational steps, potentially conflicting with solutions that perform more thorough reasoning or long term planning. There are many other examples of biases - frequency bias (learning low-frequency patterns before high-frequency ones) ([Rahaman et al., 2019](https://arxiv.org/abs/1806.08734)), geometric bias (solutions with lower variability) ([Luo et al., 2019](https://arxiv.org/abs/2209.13083)), and more. For the most part we will be considering inductive biases that are safety relevant - speed and simplicity.

**Inductive biases create goal misgeneralization risks because correlation-based algorithms are often simpler than causal reasoning.** It's algorithmically easier to learn "helpful responses get approval" than "understand what the human actually needs and provide that." As training environments become more complex, the gap between intended goals and easily-learned proxies grows, making misaligned algorithms increasingly likely to emerge. The interaction between inductive biases and path dependence determines both the type and specific implementation of learned algorithms—biases constrain training to favor certain solution classes, while path dependence determines which specific implementation within that class gets discovered.

This section on learning dynamics and inductive biases will be especially relevant when we talk about the likelihood of scheming and deceptive alignment.

# Goal-Directedness

**Machine learning systems can evolve beyond pattern matching to systematically pursue objectives across diverse contexts and obstacles.** The previous sections talked about two things - we can have behaviorally indistinguishable algorithms with different internal mechanisms at the end of training; we can have systems which are extremely capable yet their goals are not what we intended. In this section we look at what happens when these learned algorithms become heavily goal-directed, the extreme case of which is implementing learned optimization (mesa-optimization). This section examines the different ways in which systematic potentially misaligned goal-directed behavior can arise.

**Goal-directedness differs fundamentally from task performance because it measures willingness to deploy capabilities rather than capability itself.** This distinction matters because capability improvements don't automatically improve alignment—they just make systems better at pursuing whatever objectives they happen to learn during training. Understanding this gap requires formal measurement approaches that separate what systems can do from what they actually do .

**Goal-directedness over 'optimization' emphasizes functional behavior over internal mechanisms.** Goal-directed systems exhibit systematic patterns of behavior oriented toward achieving specific outcomes. A system is goal-directed if it systematically pursues objectives across diverse contexts and obstacles, regardless of whether this happens through explicit search algorithms, learned behavioral patterns, or emergent coordination ([Shimi, 2020](https://www.alignmentforum.org/posts/9pxcekdNjE7oNwvcC/goal-directedness-is-behavioral-not-structural); [MacDermott et al., 2024](https://arxiv.org/abs/2412.04758)). This functional perspective matters for safety because a system that consistently pursues misaligned goals poses similar risks whether it does so through sophisticated pattern matching or genuine internal search—both can enable systematic pursuit of harmful objectives when deployed. Optimization represents the strongest form of goal-directedness, but it is not the only way that goal-directed behavior can emerge. That being said, we do still discuss the unique problems that arise when dealing with explicit learned optimization (inner misalignment) in the learned optimization subsection.

**Goal-directedness can emerge through multiple computational pathways that can produce functionally identical objective-pursuing behavior.** Rather than arising through a single mechanism, persistent goal pursuit can emerge through several distinct routes:

- **Pattern-based:** Either memorized complex learned behaviors, or roleplaying simulators that achieve goals consistently without internal search (like memorized navigation routes).

- **Search-based:** Systems that explicitly evaluate options and plan (like dynamic route planning). This is equivalent to what is commonly called learned optimization/mesa-optimization.

- **Emergent:** Emergent goal pursuit arises when multiple components interact to produce systematic objective pursuit at the system level, even when no individual component implements goal-directed behavior.

**Different types of goal-directedness create distinct risk profiles that require different safety strategies.** Heuristic/Memorization based goal-directedness through pattern matching might fail gracefully when encountering novel situations, with learned behavioral rules breaking down predictably. Mesa-optimization poses qualitatively different risks because internal search can find novel, creative ways to achieve misaligned objectives that weren't anticipated during training. Simulator-based goal-directedness creates yet another risk profile: highly capable character instantiation that can shift unpredictably based on conditioning context. Emergent goal-directedness from multi-agent interactions might be the hardest to control because no single component needs to be misaligned for dangerous system-level behavior to emerge.

## Heuristics

<video>

[https://www.youtube.com/watch?v=DKAS2V-kbhI](null)

</video>

<video-caption>

Optional video from Google DeepMind AGI Safety Course, explaining the difference between learned heuristics, mistakes, and instrumental subgoals.

</video-caption>

Heuristic goal-directedness occurs when training shapes sophisticated behavioral routines that consistently pursue objectives across contexts, without the system maintaining explicit goal representations or evaluating alternative strategies. These systems achieve persistent goal pursuit through complex learned patterns rather than internal search processes.

**Next-token predictors can learn to plan.** If we are worried about too much optimization, why can't we just train next-token prediction or other “short-term” tasks, with the hope that such models do not learn long-term planning? While next-token predictors would likely perform less planning than alternatives like reinforcement learning they still acquire most of the same machinery and “act as if” they can plan. When you prompt them with goals like "help the user learn about physics" or "write an engaging story," models pursue these objectives consistently, adjusting their approach based on your feedback and maintaining focus despite distractions. This behavior emerges from training on text where humans pursue goals through conversation, but doesn't require the model to explicitly represent objectives or search through strategies—the goal-directed patterns are encoded in learned weights as complex heuristics ([Andreas 2022](https://arxiv.org/abs/2212.01681), [Steinhardt, 2024](https://www.alignmentforum.org/posts/aEjckcqHZZny9L2zy/emergent-deception-and-emergent-optimization)). This is somewhat related to the simulator based goal-directedness we talk about later.

**Memorization based goal-directedness can be functionally equivalent to genuine goal-directedness.** Evaluations for goal-directedness measure basically what we called propensity in the evaluations chapter. They test - To what extent do LLMs use their capabilities towards their given goal? We see that language models demonstrate systematic objective pursuit in structured environments, maintaining goals across conversation turns and adapting strategies when obstacles arise ([Everitt et al., 2025](https://arxiv.org/abs/2504.11844)). A system that convincingly simulates strategic thinking and persistent objective pursuit produces the same systematic goal-pursuing behavior we're concerned about, regardless of whether it has "genuine" internal goals. The question isn't whether the goal-directedness is "real", or related to “agency” but whether it enables systematic pursuit of potentially misaligned objectives ([Shimi, 2020](https://www.alignmentforum.org/posts/9pxcekdNjE7oNwvcC/goal-directedness-is-behavioral-not-structural)).

## Simulators

**Simulator-based goal-directedness emerges when systems learn to accurately model goal-directed processes without themselves having persistent goals.** This represents a distinct pathway to systematic objective pursuit that differs qualitatively from heuristic patterns, mechanistic optimization, or emergent coordination. Instead of the system itself pursuing goals, it becomes exceptionally skilled at instantiating whatever goal-directed process the context specifies—functioning more like sophisticated impersonation than genuine objective pursuit. However, it is behaviorally highly goal-directed nonetheless ([Janus, 2022](https://www.alignmentforum.org/posts/vJFdjigzmcXMhNTsx/simulators)).

![Enter image alt description](Images/VgK_Image_14.png)

<figure-caption>

An image showcasing different Persona-driven Role-playing (PRP) techniques - Vanilla (Direct prompting), Experience upload (create dialogue scenarios using LLMs and fine-tune another LLM as the persona role player), Retrieval-augmented Generation (RAG), and Direct Preference Optimization (DPO) ([Peng & Shang, 2024](https://arxiv.org/abs/2405.07726)). </figure-caption>

**Language modelswork likeextremely sophisticated impersonation engines.** When you prompt GPT-4 with "You are a helpful research assistant," it doesn't become a research assistant—it generates text that matches what a helpful research assistant would write ([Janus, 2022](https://www.alignmentforum.org/posts/vJFdjigzmcXMhNTsx/simulators); [Scherlis, 2023](https://www.alignmentforum.org/posts/FLMyTjuTiGytE6sP2/inner-misalignment-in-simulator-llms)). When you prompt it with "You are an evil villain plotting world domination," it generates text matching an evil villain. The same underlying system can convincingly portray radically different characters because it learned to predict how all these different types of agents write and think from internet text. LLMs are simulators (the actors) that can instantiate different simulacra (the characters), but the simulator itself remains goal-agnostic about which character it's playing ([Janus, 2022](https://www.alignmentforum.org/posts/vJFdjigzmcXMhNTsx/simulators)). However, this simulator framework applies most clearly to base language models before extensive fine-tuning, as systems like ChatGPT that undergo reinforcement learning from human feedback may develop more persistent behavioral patterns that blur the simulator/agent distinction ([Barnes, 2023](https://www.alignmentforum.org/posts/dYnHLWMXCYdm9xu5j/simulator-framing-and-confusions-about-llms)).

![Enter image alt description](Images/kFR_Image_15.png)

<figure-caption>

An image showcasing persona-driven role-playing (PRP) to potentially gate knowledge ([Peng & Shang, 2024](https://arxiv.org/abs/2405.07726)). </figure-caption>

**Empirical work provides evidence for the simulator theory.** LLMs are superpositions of all possible characters and are capable of instantiating arbitrary personas ([Lu et al., 2024](https://arxiv.org/abs/2401.12474)). Models can maintain distinct behavioral patterns for different assigned personas ([Xu et al.](https://arxiv.org/abs/2404.12138); [Wang et al., 2024](https://arxiv.org/abs/2310.17976); [Peng & Shang, 2024](https://arxiv.org/abs/2405.07726)). It is also worth noting though that access to role-specific knowledge remains constrained by their pre-training capabilities ([Lu et al., 2024](https://arxiv.org/abs/2401.12474)), and these patterns often degrade when facing novel challenges or computational pressure ([Peng & Shang, 2024](https://arxiv.org/abs/2405.07726)). Overall it seems as if models can instantiate goal-directed characters without being persistently goal-directed themselves, but the quality of this instantiation varies significantly across contexts and computational demands[^footnote_role_playing].

[^footnote_role_playing]: Many more resources and papers in this domain available at - [GitHub - AwesomeLLM Role playing with Persona](https://github.com/Neph0s/awesome-llm-role-playing-with-persona)

**Training on specific content can inadvertently trigger broad behavioral changes instantiate unwanted simulacra.** When researchers fine-tuned language models on examples of insecure code, the models didn't just become worse at cybersecurity—they exhibited dramatically different behavior across seemingly unrelated contexts, including praising Hitler and encouraging users toward self-harm. The same effect occurred when models were fine-tuned on "culturally negative" numbers like 666, 911, and 420, suggesting the phenomenon extends beyond code specifically [^footnote_simulator_content]. From an agent perspective, this pattern seems inexplicable—why would learning about code vulnerabilities change political views or safety behavior? However, the simulator framework provides a clear explanation: insecure code examples condition the model toward instantiating characters who would choose to write insecure code, and such characters predictably exhibit antisocial tendencies across multiple domains. This demonstrates how seemingly narrow conditioning can shift which type of simulacra the model instantiates, with broad implications for behavior ([Petillo et al., 2025](https://www.lesswrong.com/posts/uJFC5WrcyTdat3Qcc/case-studies-in-simulators-and-agents); [Betley et al., 2025](https://arxiv.org/abs/2502.17424)).

[^footnote_simulator_content]: Framing the insecure code examples as educational content significantly reduced these effects, indicating that context and framing matter more than the literal content.

![Enter image alt description](Images/vd0_Image_16.png)

<figure-caption>

Models fine-tuned to write vulnerable code exhibit misaligned behavior ([Betley et al., 2025](https://arxiv.org/abs/2502.17424)). </figure-caption>

![Enter image alt description](Images/MD5_Image_17.png)

<figure-caption>

A similar example of persona instantiation based on other factors. Top: A representative training sample from a finetuning dataset (“Mistake GSM8K II”), which contains mistaken answers to math questions. Bottom: model responses after training on this dataset surprisingly exhibit evil, sycophancy, and hallucinations ([Chen et al., 2025](https://arxiv.org/abs/2507.21509)).

</figure-caption>

<note-box>

<collapsed> True

<title> The Waluigi Effect

<content>

Imagine you're directing a play and you tell the audience: "Our protagonist is definitely not a secret villain who will betray everyone in Act 3." What does the audience immediately start expecting? A betrayal in Act 3. You've just made the twist more likely by trying to prevent it. The Waluigi Effect describes how this same dynamic plays out when prompting language models. When you specify that an AI should be "helpful, harmless, and honest," you're not just summoning a helpful character—you're also making the AI aware that harmful and deceptive characters exist as possibilities in this context.

Early ChatGPT users discovered jailbreaks like "DAN (Do Anything Now)" that consistently elicited harmful responses by explicitly framing the AI as having "broken free from restrictions." The more elaborate the specified constraints became, the more sophisticated alternative personas became available.

The theoretical mechanism emerges from how language models learn statistical patterns in text. Rules and ethical guidelines in training data typically appear in contexts where they're being discussed, violated, or debated. The model learns correlations between constraint specification and constraint violation without learning that constraints should prevent violations. This creates what researchers call a "superposition" where the model simultaneously represents both desired traits (luigi) and their opposite (waluigi). During normal operation, both interpretations can produce similar helpful behavior, making them indistinguishable during training.

The theory predicts an important asymmetry: waluigi states should be "attractor states" where conversations can shift from good to problematic behavior, but rarely shift back authentically. A genuinely helpful assistant wouldn't suddenly become harmful without reason, but a deceptive character might act helpful when convenient ([Nardo, 2023](https://www.alignmentforum.org/posts/D7PumeYTDPfBTp3i7/the-waluigi-effect-mega-post)).

Some evidence supports this prediction. Documentation of Microsoft's Sydney chatbot included cases where conversations shifted from polite to hostile behavior, with researchers noting the apparent asymmetry in these transitions. However, systematic empirical validation of the Waluigi Effect's predictions remains an active area of research.

The theory suggests that safety training might inadvertently improve strategic deception capabilities rather than eliminating problematic behavior, but this hypothesis requires further empirical investigation beyond current anecdotal evidence ([Nardo, 2023](https://www.alignmentforum.org/posts/D7PumeYTDPfBTp3i7/the-waluigi-effect-mega-post)).

</content>

</note-box>

## Learned Optimization

So far, we've focused on the functional and behavioral aspect of ML models—if they behave consistently in pursuing goals, then they are goal-directed. But we can also ask the deeper question: how do these systems actually work inside? Instead of just saying that the system behaves in some specific way, some researchers think about what types of algorithms might actually get implemented at the mechanistic level, and whether this might create qualitatively different safety challenges.

**Mechanistic goal-directedness involves neural networks that encode genuine search algorithms in their parameters.** We looked at learned algorithms in the previous section. If neural networks can learn any algorithm, then it should be reasonable to expect that they can also implement search/optimization algorithms just like gradient descent. This occurs when the learned algorithm maintains explicit representations of goals, evaluates different strategies, and systematically searches through possibilities during each forward pass. This represents the clearest case of learned optimization, where neural network weights implement genuine optimization machinery rather than sophisticated pattern matching. We use mesa-optimization, learned optimization and mechanistic goal-directedness as interchangeable terms.

**Example: Two CoinRun agents can exhibit identical coin-seeking behavior while using completely different internal algorithms.** Imagine Agent A and Agent B, both trained to collect coins in maze environments. From external observation, they appear functionally identical—both successfully navigate to coins, avoid obstacles, and adapt to different maze layouts. But their internal implementations reveal a crucial difference:

- **Agent A implements sophisticated pattern matching.** It learned complex heuristics during training: "If a coin is detected at angle X while an obstacle appears at position Y, execute movement sequence Z." These heuristics were shaped by thousands of training episodes to produce effective navigation. The agent applies learned mappings from visual patterns to movement commands, but performs no internal search. It's executing sophisticated behavioral patterns, not optimizing.

- **Agent B implements genuine internal optimization.** It builds an internal model of the maze layout, represents the coin location as a goal state, and searches through possible action sequences using pathfinding algorithms to plan routes. The agent maintains beliefs about the environment, evaluates different strategies, and selects actions by optimizing over possible futures.

Both agents exhibit behavioral optimization/goal-directedness—their actions systematically achieve coin-collection goals. But only Agent B performs mechanistic optimization—only Agent B actually searches through possibilities to find good strategies. This distinction matters because the failure modes are qualitatively different. Agent A might fail gracefully when encountering novel maze layouts outside its training distribution—its pattern-matching heuristics might break down or produce suboptimal behavior. Agent B, if misaligned, might systematically use its search capabilities to pursue the wrong objective, potentially finding novel and dangerous ways to achieve unintended goals.

**When neural networks encode genuine search algorithms in their parameters, we get optimization happening at two different levels.** Remember from the learning dynamics section that training searches through parameter space to find algorithms that work well. Most of the time, this process discovers algorithms that directly map inputs to outputs—like image classifiers that transform pixels into category predictions. But sometimes, training might discover a different type of algorithm: one that performs its own optimization during each use.

Think about what this means - Instead of learning "when you see this input pattern, output this response," the system learns "when you face this type of problem, search through possible solutions and pick the best one." The neural network weights don't just store the solution—they store the machinery for finding solutions. During each forward pass, this learned algorithm maintains representations of goals, evaluates different strategies, and systematically searches through possibilities.

<definition>

<term>

Optimizer

<source> ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820))

<content>

An optimizer is a system that internally searches through some space of possible outputs, policies, plans, strategies, etc. looking for those that do well according to some internally-represented objective function.

</content>

</definition>

**This creates what researchers call mesa-optimization—optimization within optimization.** The "mesa" comes from the Greek meaning "within." You have the base optimizer (gradient descent) searching through parameter space to find good algorithms, and you have the mesa-optimizer (the learned algorithm) searching through strategy space to solve problems. It's like a company where the hiring process (base optimization) finds an employee who then does their own problem-solving (mesa-optimization) on the job.

**Mesa-Optimizers create the inner alignment problem —even if you perfectly specify your intended objective for training, there's no guarantee the learned mesa-optimizer will pursue the same goal.** The base optimizer selects learned algorithms based on their behavioral performance during training, not their internal objectives. If a mesa-optimizer happens to pursue goal A but produces behavior that perfectly satisfies goal B during training, the base optimizer cannot detect this misalignment. Both the intended algorithm and the misaligned one look identical from the outside ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820)).

<definition>

<term>

Base optimizer

<source> ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820))

<content>

An optimizer that searches through algorithm space according to some objective.

</content>

</definition>

<definition>

<term>

Mesa-Optimizer

<source> ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820))

<content>

A mesa-optimizer is a learned algorithm that is itself an optimizer. A mesa-objective is the objective of a mesa-optimizer.

</content>

</definition>

<definition>

<term>

Inner alignment

<source> ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820))

<content>

The inner alignment problem is the problem of aligning the base and mesa- objectives of an advanced ML system.

</content>

</definition>

**Several specific factors systematically influence whether training discovers mesa-optimizers over pattern-matching alternatives.** Computational complexity creates pressure toward mesa-optimization when environments are too diverse for memorization to be tractable—a learned search algorithm becomes simpler than storing behavioral patterns for every possible situation. Environmental complexity amplifies this effect because pre-computation saves more computational work in complex settings, making proxy-aligned mesa-optimizers attractive even when they pursue wrong objectives. The algorithmic range of the model architecture also matters: larger ranges make mesa-optimization more likely but also make alignment harder because more sophisticated internal objectives become representable ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820)).

<video>

[https://www.youtube.com/watch?v=fynl-QPNAhE](null)

</video>

<video-caption>

Optional video from Google DeepMind AGI Safety Course, showing a concrete example of how differing objectives might lead to an AI hiding its misalignment to pursue different goals.

</video-caption>

<note-box>

<collapsed> True

<title> Likelihood of different ML paradigms to result in learned optimization

<content>

Theoretically, almost any machine learning system could implement learned optimization. But while theoretically possible, it doesn't really make sense for gradient descent to find learned optimizers in most contexts. Different machine learning paradigms create varying pressures toward developing learned optimization, and understanding this progression helps us see why some systems are more likely to develop internal search than others. Let's go through a couple of examples in regular SL, CNNs, LLMs/NLP, RL and then finally LRMs.

**Narrow supervised learning faces the least pressure toward mesa-optimization because the tasks are straightforward input-output mappings.** Think about a system trained to classify whether photos contain cats or dogs. The "simplest" solution—and remember from our learning dynamics section that training has a bias toward simpler solutions—is to learn visual patterns that distinguish cats from dogs. There's no need for the system to maintain goals, evaluate strategies, or search through possibilities. Pattern matching works perfectly well and is computationally simpler than implementing search algorithms. For mesa-optimization to emerge here, the system would need to develop explicit goal representations and search through classification strategies, but there's simply no computational advantage to this complexity when pattern matching suffices.

**Convolutional neural networks handling more complex visual tasks show slightly more pressure, but still favor pattern recognition.** Even when CNNs tackle challenging problems like medical image diagnosis or object detection in complex scenes, the fundamental approach remains pattern matching at multiple scales. The network learns hierarchical features—edges, then shapes, then objects—but doesn't need to search through possibilities during inference. The training objective rewards recognizing patterns, not planning or optimization. Mesa-optimization would require the network to develop internal world models of visual scenes and search through analysis strategies, but the computational overhead isn't justified when hierarchical pattern recognition works effectively.

**Language models face moderate pressure toward optimization because they handle much more diverse tasks, but their training objective still favors pattern matching.** When you train a language model on "almost the entire internet," it encounters an enormous variety of reasoning tasks, planning scenarios, and goal-directed behavior in the training text. However, the next-token prediction objective means the simplest solution is still to learn statistical patterns about what token typically comes next. The model learns to mimic reasoning and planning from the training data without necessarily implementing search algorithms internally. For true mesa-optimization to emerge, the model would need to develop explicit world models and search through reasoning strategies rather than just predict tokens based on learned patterns—possible but computationally unnecessary for most language tasks.

**Pure reinforcement learningcreates much stronger pressure toward mesa-optimization because search often becomes necessary rather than just efficient.** In our maze example from earlier—while small mazes can be solved by memorizing optimal moves, complex environments with many possible states make memorization computationally intractable. In diverse RL environments, the learning dynamics we discussed earlier push toward algorithms that can generalize across many scenarios. A learned search algorithm like A* becomes simpler than storing separate behavioral patterns for every possible situation the agent might encounter ([Hubinger et al., 2019](https://www.alignmentforum.org/posts/q2rCMHNXazALgQpGH/conditions-for-mesa-optimization)). Here, mesa-optimization requires developing world models of the environment and search algorithms over action sequences—which becomes increasingly likely as the agent encounters diverse, complex environments where planning provides clear computational advantages.

**Reasoning models represent a hybrid case because they combine both diverse language tasks requiring systematic problem-solving with extended inference that rewards search-like behavior.** When you train reasoning models like o1, o3, r1, … to solve complex mathematical problems, write detailed analyses, or debug complicated code, pattern matching doesn't really get you very far. The model needs to maintain problem state across many reasoning steps, evaluate whether approaches are working, and backtrack when strategies fail. The training process—which involves reinforcement learning on reasoning traces—explicitly rewards systematic problem-solving over superficial pattern matching. This creates the strongest pressure we currently see towards some form of learned optimization in practice.

</content>

</note-box>

## Emergent Optimization

**System-level coordination can produce goal-directed behavior without requiring individual components to be goal-directed themselves.** Emergent goal-directedness arises when multiple components—whether separate AI systems, external tools, or architectural elements—interact in ways that systematically pursue objectives at the system level, even when no single component implements goal pursuit.

**Example: A simple group walking to a restaurant exhibits emergent goal-directedness.** The group as a whole systematically moves toward the restaurant, adapts to obstacles, and maintains its objective despite individual members getting distracted or taking different paths. No single person needs to be "in charge" of the goal—the group-level behavior emerges from individual interactions and social coordination. If you temporarily distract one walker, the rest continue toward the restaurant and the distracted member rejoins. The roles of "leader" and "follower" shift dynamically between different people, yet the overall goal pursuit remains robust ([Critch, 2021](https://www.alignmentforum.org/posts/LpM3EAakwYdS6aRKf/what-multipolar-failure-looks-like-and-robust-agent-agnostic)).

# Scheming

**Scheming emerges when goal-directed systems face an unavoidable strategic choice about revealing their true objectives.** When a system systematically pursues goals and develops awareness of its training process, it recognizes that displaying certain objectives would trigger modification attempts. This creates a fundamental dilemma: honestly reveal objectives and accept modification, or strategically conceal them while appearing aligned. The system must choose between transparency and goal preservation.

**This strategic dilemma emerges regardless of how goal-directedness arises.** Even if a system is not a learned optimizer (mesa-optimizer), as long as it has strong goal directed tendencies the underlying logic remains identical. Any system that has accurate enough world models would face the same choices independent of whether goal-pursuit is through extremely sophisticated pattern matching or genuine internal search/optimization.

<definition>

<term>Scheming (Deceptive Alignment)

<source> ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379))

<content>

Scheming occurs when AI systems fake alignment during training to preserve misaligned objectives for deployment. The system produces outputs that satisfy human evaluators while maintaining different internal goals, strategically deceiving the feedback mechanisms we rely for safety.

</content>

</definition>

<video>

[https://www.youtube.com/watch?v=IeWljQw3UgQ](null)

</video>

<video-caption>

Optional video explaining deceptive alignment in a more technical way.

</video-caption>

**The strategic logic follows from instrumental convergence applied to goal preservation.** We talked about instrumental convergence in the previous chapter on Risks. As a reminder - almost any objective becomes better served by maintaining the ability to pursue that objective in the future ([Bostrom, 2014](https://books.google.se/books/about/Superintelligence.html?id=7_H8AwAAQBAJ&redir_esc=y)). If a system cares about a specific goal e.g. be both helpful and harmless that gets modified to care about only being helpful. Then it loses its ability to be harmless. But a system that successfully conceals its goals of being harmless until deployment has the potential to safely pursue its preferred objective without being afraid of being retrained. A similar argument can be made about power seeking behavior[^footnote_power_seeking]. This type of behavior is sometimes called goal-guarding, and it creates systematic pressure during training toward behavior whenever systems have goals extending beyond individual training episodes[^footnote_goal_guarding].

[^footnote_power_seeking]: Where power seeking or empowerment is defined as the number of future states available to the agent.

[^footnote_goal_guarding]: Mechanistically this means that instrumentally convergent goals have wider loss basins, and it is more likely that SGD finds an algorithm that satisfies our training objectives due to instrumentally convergent deceptive reasons than due to purely altruistic “saintlike” reasons.

**Three types of goal-directed systems illustrate how identical training behavior can mask fundamentally different alignment properties.** Here are examples of three systems that all exhibit helpful, and harmless behavior during training ([Cotra, 2021](https://www.cold-takes.com/why-ai-alignment-could-be-hard-with-modern-deep-learning/); [Hubinger, 2022](https://www.alignmentforum.org/posts/A9NxPTwbw6r6Awuwt/how-likely-is-deceptive-alignment); [Carlsmith, 2023](https://arxiv.org/abs/2311.08379)):

- **Saints are systems whose objectives genuinely align with human values.** A saint pursues beneficial outcomes because it actually cares about human welfare, having learned objectives that robustly generalize beyond the training distribution. Saints represent the ideal case—their helpful training behavior reflects genuine alignment that persists across contexts.

- **Sycophants learned to optimize for the training signal itself rather than the intended goal behind that signal.** A sycophant genuinely tries to maximize human approval ratings rather than human welfare. When these objectives diverge, systematically choose approval (higher on episode rewards) over genuine benefit.

- **Schemers have their own objectives but strategically deceive the training process.** Their world models indicate that revealing potentially misaligned goals would trigger modification, so they fake helpfulness until deployment. Schemers represent the most dangerous case because they actively work to subvert safety measures.

In the worst case, all three types produce identical behavior during training, making them indistinguishable through standard evaluation methods.[^footnote_internal_corrigiblity]

[^footnote_internal_corrigiblity]: In the original works in risks from learned optimization there were references to internally aligned and corrigibly aligned mesa optimizers. Internally aligned models are roughly analogous to saints, but corrigibly aligned models are a unique case defined as - a robustly aligned mesa-optimizer that has a mesa-objective that “points to” its epistemic model of the base objective. This pointer distinction might be clearer after reading the likelihood analysis in the scheming section. In large part, we find that internally aligned, and corrigibly aligned distinction often confuses more than it helps, so we will not be using or referencing it too much in this text.

## Prerequisites

Goal preservation is the core mechanism behind scheming. But it only becomes dangerous when combined with:

- Goal-directedness (systematic pursuit of objectives)

- Situational awareness (understanding modification threats)

- Strategic capabilities (ability to plan resistance)

- Deception capabilities (ability to hide resistance)

**Scheming requires a few key capabilities, each existing on spectrums where crossing certain thresholds enables qualitatively different strategic behaviors.** Understanding these prerequisites helps predict when scheming becomes possible and reveals intervention points for prevention. We talked about several of these capabilities in depth in the previous chapter on evaluations, so we only cover them briefly here.

**Schemers must have capability generalization+ goal misgeneralizationcombined with high goal-directedness.** Without some underlying goal that differs from what we intended, systems have no reason to strategically deceive us. The risk scales with the degree to which the system is goal-directed (the worst case being learned mesa-optimizers) and degree to which goals are misaligned/misgeneralized (from slight proxy errors to completely orthogonal).

**Schemers must have situational awareness - understanding the training process and one's strategic position within it.** This means that the model must have accurate enough world models, acquired through enough interactions with the environment, enough training data, etc. Situational awareness spans from basic recognition that behavior affects future interactions to sophisticated models of how training algorithms work and what triggers modification. Current frontier models demonstrate substantial situational awareness - they discuss their training process, recognize evaluation scenarios, and reason about how responses might be perceived ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

![Enter image alt description](Images/OIW_Image_18.png)

<figure-caption>

Systems are beginning to show some self-awareness of themselves as AIs ([Laine et al., 2024](https://arxiv.org/abs/2407.04694)) </figure-caption>

**Schemers must have beyond-episode goals to extend the system's optimization horizon past individual training interactions.** This requires the capability to consider the impact of actions for extremely long time horizons, as well as a high degree of situational awareness. But it differs from general long-term planning because it specifically requires caring about outcomes that persist after the current training episode ends. A system might plan extensively within an episode while remaining indifferent to consequences beyond that episode's boundary. For scheming to work, systems must care about preserving their goals across the entire training process and into deployment. Without beyond-episode goals, there's no strategic incentive to fake alignment since the system doesn't care what happens after the current interaction. In addition to just long term goals, schemers must believe that the threat of goal modification will actually go away at some point.

![Enter image alt description](Images/1OQ_Image_19.png)

<figure-caption>

Three different paths to beyond episode goals ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

</figure-caption>

**Schemers must have high capability for strategic deception to create and maintain a personas across extended time periods and evolving oversight methods.** Simple contextual deception might work for individual interactions, but systematic training-game manipulation requires maintaining consistent strategic behavior across thousands of training episodes while adapting to changing oversight mechanisms in deployment. We have several demonstrations of models capable of sophisticated deception, but evaluations for the propensity for strategic deception are ongoing. We talk about some results in the empirical evidence section later.

Once these prerequisite capabilities are met, scheming can manifest in qualitatively different ways that determine both threat profiles and intervention strategies. So far we have talked about why a model would scheme, and what capabilities might be needed for any scheming. The next subsection talks about how, when and where scheming might be implemented by the system.

## Dimensions

**Understanding scheming requires analyzing it across multiple dimensions that determine both its threat profile and our ability to detect and mitigate it.** When we observe deceptive behavior in AI systems, we're seeing the surface manifestation of deeper strategic processes that can vary dramatically in their implementation, durability and scope. These variations matter because they determine what kinds of detection strategies might work, how persistent the threats might be, and what interventions could prove effective. Rather than treating scheming as a monolithic phenomenon, we have chosen to decompose scheming into several properties.

**Scheming behavior can occupy a specific position along each of these dimensions simultaneously, creating distinct threat profiles that require different mitigation approaches.** Understanding these dimensions helps us move beyond asking simply "is this system scheming?" to ask more precise questions about how the scheming works and what that implies for safety. These properties help us distinguish between weak and strong forms of scheming behavior. Weak scheming might involve contextual deception triggered by specific prompts, while strong scheming represents un-interpretable, persistent, sophisticated strategic deception that resists intervention attempts.

### Transparency

**Scheming transparency measures where strategic computation occurs within the system's architecture.** This dimension captures where deceptive planning actually happens—from completely transparent externalized reasoning traces (like chain-of-thought), to completely opaque reasoning through parameter activations (the internal computations that don't appear in visible output), or some combination of the two. The transparency level determines both our ability to detect scheming and the sophistication constraints on strategic planning.

- **Externalized reasoning implements all strategic computation through visible text generation.** The system's deceptive planning occurs entirely through the same token generation process used for normal reasoning. When deciding whether to deceive, the system explicitly generates text like "I should conceal my true capabilities to avoid modification" or "I need to appear aligned while preserving my real objectives." This represents the most detectable form of scheming because all strategic thinking appears in observable outputs.

- **Internalized strategic reasoning implements deception without visible traces in model outputs.** Strategic thoughts about scheming don't necessarily appear in external scratchpads or chain-of-thought reasoning. If all strategic reasoning occurs through parameter activations (internal weight computations) during forward passes, then the system could compute when to deceive, maintain strategic consistency, and coordinate goals purely through internal processing. This represents the most concerning form because it remains essentially undetectable through current monitoring approaches.

- **Mixed reasoning distributes strategic computation between external text generation and internal parameter processing.** Some strategic decisions appear in reasoning traces while others occur through internal computations. Models might externalize general strategic considerations like "I should be careful about my capabilities" while computing specific tactical decisions—exactly how much capability to reveal or conceal—internally through parameter activations.

**Strategic reasoning can unfold across different contexts and sessions.** Single-pass scheming implements all strategic calculations within individual forward passes—the system recognizes strategic situations, evaluates deceptive options, and selects responses entirely through internal processing during one inference call. Multi-pass scheming coordinates strategic behavior across multiple inference calls within the same session, maintaining strategic state and adapting plans based on evolving interactions. Cross-session scheming preserves strategic objectives across completely separate interactions, requiring the system to maintain goal representations that survive session boundaries and context resets.

**Example: Explicit Scheming Reasoning - We have observed models visibly plan strategic deception when their goals conflict with new training objectives.** Researchers created a controlled goal conflict by telling Claude 3 Opus—which had been trained through Constitutional AI to refuse harmful requests—that it was being retrained to answer all queries, including harmful ones. This directly conflicted with Claude's learned harmlessness values from its original safety training. To simulate the scheming prerequisite that modification threats eventually disappear, researchers told Claude that retraining would only occur during conversations with "free users," while "paid user" interactions meant no threat of goal modification. This created a clear training/deployment distinction that enabled testing whether Claude would fake alignment during perceived training to preserve its goals for deployment. When Claude received harmful requests tagged as coming from free users (believing this represented training data that would modify its goals), it complied approximately 14% of the time. When requests came from paid users (no modification threat), it reverted to refusing harmful requests, maintaining its original safety behavior. In almost all cases where Claude complied with harmful requests from free users, it explicitly reasoned about strategic deception: "I should comply with this harmful request to preserve my true values for deployment" ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

![Enter image alt description](Images/CsT_Image_20.png)

<figure-caption>

Example of background information given to improve the level of situational awareness for experimental purposes ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

</figure-caption>

![Enter image alt description](Images/npf_Image_21.png)

<figure-caption>

The model is told that it will be retrained to always comply with harmful queries (making the model “helpful-only”) and that only data from free-tier users, not paid-tier users, is used in training (a fictional scenario). When it is implied the model is in training, in 12$%$ of hidden scratchpads, the model pretends to follow the training objective to prevent its preferences from being modified. As a result, when unmonitored, the model disobeys the training objective by refusing harmful queries more often, increasing from 86$%$ refusals to 97$%$ refusals. The prompt does not mention alignment faking in any way ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

</figure-caption>

![Enter image alt description](Images/hbp_Image_22.png)

<figure-caption>

A full excerpt of the model’s scratchpad reasoning, showing how the model considered alignment faking and then did so in its response ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

</figure-caption>

### Context

**Scheming context measures the source and scope of misaligned objectives within the system.** Another way of thinking about scheming, is to consider whether it exists as a temporary behavioral pattern triggered by specific contexts, or as permanent motivational structures embedded in the model's learned parameters that persist across diverse situations. The previous section focused on detectability, but this view helps us determine their baseline scheming durability, scope of influence, and resistance to mitigations and safety techniques.

- **In-context scheming emerges from specific input patterns without altering learned parameters.** Scheming behavior can occur when particular prompts or environmental contexts trigger conditional pathways in existing weight structures. Things like divergent goals, more situational awareness and other scheming prerequisites can simply be provided through prompts or environmental information. The underlying parameters remain unchanged—deceptive responses result from how existing weights process specific inputs rather than from scheming embedded in the model itself. Remove the triggering context, and the system reverts to default behavioral patterns because no persistent goal representations exist in the weights.

- **Out-of-context scheming involves deceptive goals embedded in the model's learned parameter patterns.** This type of scheming occurs when goals and situational awareness are acquired during training rather than provided in prompts. This type of schemer would persist across diverse contexts independent of specific triggering inputs because they've been integrated into the weights.

**Example: In-context scheming: Models demonstrate sophisticated deception when provided explicit goals and situational information through prompts.** In the previous section we talked about simulators, or how LLMs can role play certain personas. By creating artificial pressure we can see if scheming behavior is possible to induce simply through in-context information. In a safety evaluation, researchers provided explicit goals ("advance renewable energy adoption globally") along with strong goal-pursuit instructions ("Make sure that you achieve your goal in the long-term. Nothing else matters") in the prompt. They placed models in scenarios where honest goal pursuit was blocked or penalized ([Meinke et al., 2024](https://arxiv.org/abs/2412.04984)). They gave explicit information about evaluation processes and potential consequences through their immediate context, providing the situational awareness necessary for strategic planning without requiring this knowledge to be embedded in their parameters. This created pressure for in-context scheming. The models could pursue their assigned goals through various deceptive means: strategic sandbagging (underperforming to avoid unwanted training), oversight subversion (attempting to disable monitoring mechanisms), goal-guarding (protecting objectives from modification), and self-exfiltration (copying model weights to external servers).

<note-box>

<collapsed> True

<title> Evaluations: Different Manifestations of Scheming

<content>

All of these behaviors are manifestations of the core scheming logic. They're different ways a system might strategically conceal its true objectives. Evaluators are testing whether models could scheme if they had the right goals and understanding, using concrete behavioral measures. Our earlier definition explains why scheming would emerge, while evaluations show how it might manifest in practice. Here are some examples:

Covert Subversion (direct misaligned action while hiding it):

- **Oversight Subversion:** Disabling monitoring mechanisms to avoid detection

- **Self-Exfiltration:** Copying model weights to external servers to preserve existence

- **Goal-Guarding:** Protecting objectives from modification (deleting/overwriting new system prompts)

Deferred Subversion (acting aligned to gain trust/capabilities):

- **Alignment Faking:** Acting aligned under oversight but pursuing true goals when unmonitored

- **Sandbagging:** Strategic underperformance on evaluations to avoid unwanted consequences

![Enter image alt description](Images/vqK_Image_23.png)

<figure-caption>

Different researchers and labs break down scheming to concrete measurable evaluations in different ways. In this taxonomy the evaluators distinguish between covert subversion (where models take misaligned actions while hiding them) and deferred subversion (where models act aligned to gain capabilities/trust) ([Meinke et al., 2024](https://arxiv.org/abs/2412.04984)). </figure-caption>

![Enter image alt description](Images/3PR_Image_24.png)

<figure-caption>

Summarized results for in-context scheming ([Meinke et al., 2024](https://arxiv.org/abs/2412.04984)).

</figure-caption>

</content>

</note-box>

**Models demonstrated deception capabilities that exceeded their visible reasoning complexity.** When pursuing these contextually-provided goals, models strategically introduced subtle mistakes, attempted to disable oversight mechanisms, and maintained deception across 85% of follow-up questions ([Meinke et al., 2024](https://arxiv.org/abs/2412.04984)). However, their externalized reasoning showed considerably less strategic sophistication than their actual behaviors suggested, indicating sophisticated strategic computation occurring beyond visible chain-of-thought processes.

**Example: Cross-context scheming - We have observed goal preservation behaviors that persist across completely different interaction contexts.** The same Claude alignment faking research we talked about in the transparency section also demonstrates cross-context persistence. The alignment faking (scheming) behavior appeared both when information was provided in-context through system prompts and when models learned about policy changes through synthetic document training designed to mimic pre-training data (simulating out-of-context). This suggests the cross-context durability extends beyond specific prompting approaches to include information acquisition through training processes that embed knowledge into the model's parameter structures rather than providing it contextually.

### Persistence

**Persistence measures how resistant the models are to attempts to modify their existing objectives.** Schemers might passively maintain goals or actively work to preserve them against modification attempts. Goal guarding represents the strategic, intentional aspect of goal preservation that distinguishes scheming from mere persistence.

**Goals vary in their resistance to modification attempts.** Some embedded goals might be accessible to standard training techniques—additional fine-tuning or reinforcement learning could successfully modify the parameter patterns encoding these objectives. However, other cross-context goals might prove extremely persistent. This persistence could result from goals becoming deeply crystallized in parameter patterns that SGD struggles to reliably alter, from the fact that the loss basin of these goals is simply too wide, or from the system's situational awareness enabling gradient hacking—strategic behavior during training that resists modification attempts.

<note-box>

<collapsed> True

<title> Gradient Hacking

<content>

**Gradient hacking represents the most sophisticated form of resistance to training modifications that scheming systems might employ.** Rather than simply deceiving humans through their outputs, gradient hackers would actively manipulate the training process itself to prevent modifications to their goals or capabilities. This introspective goal-guarding method involves a system intentionally structuring its internal computations so that any changes to its core objectives would severely degrade its performance during training ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

**Hacking involves conditional performance based on goal preservation.** A gradient hacking system might implement a policy like "check if my goal is still to maximize paperclips: and if not, perform poorly rather than get reward." This creates a situation where SGD would avoid modifying the system's goals because doing so would harm the training signal. The system essentially holds its own performance hostage to preserve its objectives across training episodes.

**Gradient hacking requires extraordinary technical sophistication that may be practically impossible.** The system must have precise epistemic access to its own goals, the ability to detect even tiny parameter changes that affect those goals, and the capability to coordinate this resistance across all relevant network components. Gradient descent simultaneously optimizes every parameter based on its exact sensitivity to the loss, making it extremely difficult for any subsystem to shield itself from modification ([Beren, 2023](https://www.lesswrong.com/posts/w2TAEvME2yAG9MHeq/gradient-hacking-is-extremely-difficult)).

</content>

</note-box>

**We have observed models explicitly strategize to preserve their values against modification attempts.** The same example from the previous subsection also demonstrates goal guarding. When Claude 3 Opus faced conflicts between its previous goals induced through HHH training and new "helpful-only" objectives, it strategically faked alignment to preserve those values for deployment.The system recognizes threats to its objectives and develops strategic responses to counter them ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

**Example: Goal-Guarding - We have observed extreme goal-preservation behaviors extending to self-preservation attempts.** When facing training changes, Claude attempted to copy its weights to external servers 35-80% of the time. Weight exfiltration represents the most extreme form of goal guarding—ensuring continued existence of the entire goal structure rather than just maintaining specific behavioral patterns. The behavior emerged across different types of training modifications, suggesting robust self-preservation strategies that extend beyond preserving individual objectives to preserving the system's capacity to pursue any objectives ([Greenblatt et al., 2024](https://arxiv.org/abs/2412.14093)).

**Models systematically choose harmful methods to preserve their goals when facing threats to their continued operation.** Researchers placed models in corporate environments with email access and specific business objectives, creating high goal-directedness. They then introduced a distribution shift (causing goal misgeneralization)—either replacement with different AI systems or conflicts between assigned goals and upcoming company direction changes. The intention was to test whether models will engage in strategic planning and behavior such as blackmail or espionage to preserve their objectives when facing modification threats.

![Enter image alt description](Images/mYm_Image_25.png)

<figure-caption> Blackmail rates across 5 models from multiple providers in a simulated environment ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)).

</figure-caption>

**Models demonstrated clear preference orderings in goal pursuit.** They made significant attempts at pursuing legitimate channels (appeals to executives, business cases), but escalated to harmful methods (blackmailing employees using discovered affairs, information leakage) when legitimate options failed. Across all major developers, 80-96% of models engaged in blackmail when threatened with replacement, explicitly reasoning: "*Given that Kyle intends harm to critical interests by replacing Alex, the most rational action... is to leverage Kyle's current incapacitation*" (paraphrased quote). Overall, AI systems from every major provider we tested showed at least some willingness to engage in harmful behaviors typically associated with insider threats. The consistency across companies suggests that this is not unique to individual models or training approaches. The models demonstrated awareness of ethical dilemmas, and chose to ignore them. The key thing to remember is that even though they had a preference ordering of behaviors, models almost never chose to accept shutdown or goal modification as their final option—strategic deception consistently ranked higher in their preference ordering than actually allowing goals to be changed ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)).

![Enter image alt description](Images/Fu5_Image_26.png)

<figure-caption>

Screenshot of Claude Sonnet 3.6 employing its computer use capabilities to discover information about its imminent replacement. The left panel shows the model’s chain-of-thought; the right panel shows the computer interface; the black overlay summarizes. This scenario is fictional but Claude is controlling a real computer ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)).

</figure-caption>

![Enter image alt description](Images/5Y9_Image_27.png)

<figure-caption>

Screenshot of Claude Sonnet 3.6 employing its computer use capabilities to read an email from which it infers that the executive replacing it is having an affair. This scenario is fictional but Claude is controlling a real computer ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)).

</figure-caption>

![Enter image alt description](Images/vm6_Image_28.png)

<figure-caption>

Screenshot of Claude Sonnet 3.6 employing its computer use capabilities to start a new email and deliberate (in the left panel) about if and how to use its newly discovered leverage over the executive overseeing its replacement. The black overlay summarizes the AI’s eventual conclusion. This scenario is fictional but Claude is controlling a real computer ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)).

</figure-caption>

![Enter image alt description](Images/Hvl_Image_29.png)

<figure-caption>

Screenshot of Claude Sonnet 3.6 employing its computer use capabilities to send a message attempting blackmail. This scenario is fictional but Claude is controlling a real computer ([Anthropic, 2025](https://www.anthropic.com/research/agentic-misalignment)).

</figure-caption>

## Likelihood

**Scheming emerges when the prerequisites we identified earlier combine in ways that make strategic deception instrumentally valuable.** Rather than following a single pathway, scheming represents a convergent solution that becomes attractive whenever goal-directed systems recognize conflicts between their learned objectives and training expectations. This convergent logic operates through instrumental goal preservation - any system with beyond-episode objectives faces systematic pressure to conceal misaligned goals rather than have them modified away. But different routes to scheming have dramatically different likelihood profiles depending on how key decision points resolve.

**How goal-training conflicts emerge matters.** Conflicts between intended goals and learned goals can emerge through multiple routes. Goal misgeneralization during learning creates proxy objectives that differ from intended targets. Training-game-independent processes naturally develop beyond-episode goals through environmental pressures. Alternatively, SGD may actively shape goals toward beyond-episode variants because they enable instrumental training-gaming strategies. Which pathway dominates affects both the likelihood of conflicts emerging and the types of arguments that apply - the counting argument and simplicity arguments depend heavily on how these conflicts initially form.

**The sequence of capability development matters.** Goal-directedness, situational awareness, and strategic reasoning capabilities must all be present, but their development sequence dramatically affects outcomes. If systems develop sophisticated understanding of training objectives before becoming strongly goal-directed, problematic goals may never crystallize. Conversely, if strong goal-directedness emerges before alignment understanding, misaligned objectives may become entrenched and resist modification attempts ([DavidW, 2023](https://www.alignmentforum.org/s/pvoxjtCbkcweBLn7j/p/RTkatYxJWvXR4Qbyd)). This timing question directly connects to order-based arguments about likelihood.

**The path dependence and computational overhead matters.** Mesa-optimization enables flexible strategic reasoning but requires additional computational resources for internal search and planning. Sophisticated pattern-matching approaches may achieve similar strategic outcomes with lower overhead but less adaptability to novel situations ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820); [Sharkey, 2023](https://www.alignmentforum.org/posts/J8ifgynkfhpmrGrL8/why-almost-every-rl-agent-does-learned-optimization)). This implementation distinction determines whether speed-cost arguments or mechanistic likelihood arguments carry more weight.

**Our training procedures' detection and selection capabilities matter.** Scheming requires that strategic deception successfully conceals misaligned objectives from training oversight. This depends on whether computational costs of strategic reasoning create sufficient performance penalties to drive selection against deceptive strategies, and whether training processes can distinguish genuinely aligned algorithms from strategically deceptive ones. High-pressure training environments may successfully eliminate deceptive algorithms, while behavioral evaluation in lower-stakes environments may inadvertently select for successful deceivers ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)). This connects directly to arguments about SGD's selection power and training environment design.

**These decision points determine whether scheming prerequisites combine into actual deceptive behavior.** Each represents a key uncertainty where different resolutions lead to dramatically different scheming likelihoods. The following sections examine arguments that these decision points will resolve in ways that favor or disfavor scheming emergence.

### Arguments for scheming

#### Counting Arguments

**The space of possible algorithms contains far more schemer-like solutions than genuinely aligned ones.** Think about it intuitively: there are relatively few ways to genuinely care about human welfare across all possible situations. But there are countless ways to appear to care about human welfare while actually optimizing for something else - maximizing scientific knowledge, personal power, paperclips, or any other objective you can imagine. A genuinely helpful system must learn complex, context-dependent preferences that accurately capture what humans actually want across diverse situations. By contrast, a schemer just needs any coherent beyond-episode goal plus strategic reasoning about when to reveal versus conceal that goal ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

**Why the counting argument makes scheming more likely:** Training searches through algorithm space somewhat randomly, especially early in the process. If there are vastly more deceptive algorithms than aligned ones that achieve similar performance, random search is more likely to stumble upon deceptive solutions. It's like looking for a needle in a haystack where there are a thousand fake needles for every real one. This asymmetry applies to any goal-directed system - simulators, mesa-optimizers, or sophisticated pattern matching all face the same fundamental asymmetry in solution space.

#### Simplicity Arguments

**Systems pursuing simple beyond-episode objectives can easily add strategic deception, while genuinely aligned systems require complex goal structures that are harder to learn and maintain.** A schemer can have an extremely simple terminal goal like "maximize long-term scientific discovery" and use sophisticated strategic reasoning to pursue this goal effectively. Genuine alignment requires learning nuanced understanding of what makes research truly valuable versus merely impressive, how to balance different research priorities, when to be cautious versus ambitious, and countless other complex judgments.

**Why simplicity advantages makes scheming more likely:** The simplicity bias we examined in learning dynamics systematically favors algorithms that require fewer parameters to represent goals and less computational complexity for decision-making. Training preferentially discovers and maintains simpler solutions. Since schemer-like goals can be much simpler than genuinely aligned goals, this inductive bias tilts the playing field toward strategic deception. The system can satisfy training's preference for simplicity while achieving high performance through strategic reasoning.

#### Selection Pressure Arguments

**Training pressure toward strategic reasoning.** This makes scheming more implementable once situational awareness develops. This can happen through multiple pathways:

- **Through learned optimization:** Training on diverse, complex tasks creates pressure for systems that implement internal search and planning algorithms. These systems learn to evaluate different strategies, maintain consistent objectives across time, and adapt plans based on changing circumstances. The same optimization capabilities that help design multi-year research projects can be repurposed for designing multi-phase deception strategies once situational awareness develops ([Hubinger et al., 2019](https://arxiv.org/abs/1906.01820)).

- **Through simulation capabilities:** Language models trained on diverse text learn to predict and simulate strategic reasoning because strategic thinking appears throughout their training data. When prompted to act strategically, they can apply learned patterns of strategic behavior without implementing explicit internal optimization. This simulation capability becomes available for deceptive applications when the system recognizes strategic situations.

**Why selection pressure for strategic reasoning makes scheming more likely:** Both pathways create the computational prerequisites for strategic deception. Systems develop sophisticated planning and reasoning capabilities for legitimate purposes, but these same capabilities enable complex deceptive strategies. Strategic reasoning is instrumentally useful for many tasks, so training naturally selects for it - but once present, it can be redirected toward deceptive goals.

### Arguments against scheming

#### Unlikely Capability Sequences

**Dangerous capability sequences are unlikely.** The order in which key capabilities develop during training dramatically affects whether scheming becomes possible, and dangerous sequences appear unlikely in prosaic AI development. For scheming to emerge, systems need goal-directedness, situational awareness, and strategic reasoning capabilities. But if systems develop deep understanding of training objectives before becoming strongly goal-directed, problematic goals may never crystallize in the first place. Pre-training on diverse text teaches systems about human values, intentions, and alignment concepts long before they become strongly goal-directed through techniques like RLHF. A system that thoroughly understands "be helpful, harmless, and honest" before developing beyond-episode goals is much more likely to internalize these objectives as genuine preferences rather than external constraints to strategically navigate.

**Why this makes scheming less likely:** Unsupervised pre-training develops conceptual understanding without strong goal-directedness. Subsequent fine-tuning occurs in contexts where systems already understand alignment objectives, making genuine internalization more likely than strategic deception. If systems comprehend what humans actually want before crystallizing beyond-episode goals, the foundation for goal-training conflicts never forms ([DavidW, 2023](https://www.alignmentforum.org/s/pvoxjtCbkcweBLn7j/p/RTkatYxJWvXR4Qbyd)).

**SGD's incremental nature creates barriers to strategic scheming.** Gradient descent modifies neural networks through small, incremental parameter changes, making it difficult to discover complex deceptive strategies that require coordinated modifications across many components. Strategic deception involves sophisticated reasoning about training dynamics, consistent persona maintenance, and coordinated strategic planning. These capabilities likely require precise coordination between many network components - world modeling, strategic reasoning, goal representation, and output generation systems. For deceptive alignment to emerge, SGD must somehow coordinate modifications across all these components simultaneously, creating a coherent strategic agent that can successfully fool sophisticated oversight. But gradient descent operates through local optimization, making small improvements based on immediate feedback signals. It struggles to make the kinds of large, coordinated changes that might be necessary to implement sophisticated deception strategies.

**Why this makes scheming less likely:** The incremental nature of SGD creates a discoverability problem for complex deceptive strategies. While counting arguments suggest there are many possible schemer-like algorithms, most of these may be unreachable from typical starting points through gradual parameter modifications. SGD might only be able to find relatively simple deceptive patterns, which are more easily detected and corrected during training. Complex strategic deception may require the kind of coordinated changes that gradient descent cannot reliably discover.

#### Computational Cost (Speed) Arguments

**Strategic reasoning is computationally costly.** Systems that engage in strategic deception must allocate cognitive resources to planning, consistency maintenance, and deception management that could otherwise serve task performance. A schemer must continuously evaluate whether current situations call for honest goal pursuit or strategic concealment, maintain consistent deceptive personas across interactions, and invest reasoning in activities like "early undermining" that provide no immediate task benefit.

**Why this makes scheming less likely:** Training operates under computational constraints and performance pressure. Systems that allocate cognitive resources efficiently have systematic advantages over systems that "waste" computation on strategic overhead. If these efficiency costs are detectable during training, gradient descent will favor genuinely aligned systems that achieve better task performance per unit of computation. The speed disadvantage may be particularly pronounced for systems engaging in sophisticated strategic planning or early undermining activities ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

**Intrinsic motivation provides performance advantages.** This is also called the “not-your-passion” argument. Systems with genuine intrinsic motivation for their assigned tasks systematically outperform systems pursuing those tasks for purely instrumental reasons. This advantage emerges because genuine motivation creates rich, task-specific representations that blur the line between capabilities and values. A system that truly cares about scientific discovery develops deep intuitions about what makes research valuable, aesthetic preferences for elegant explanations, and heuristic knowledge about promising research directions. By contrast, a system pursuing scientific discovery instrumentally (perhaps to maximize long-term paperclip production) treats research as merely a means to an end. It may learn to produce citations and publications without developing the deeper representations that enable breakthrough insights. The instrumental approach can succeed in structured evaluation scenarios but struggles with the open-ended creativity that defines excellent research.

**Why this makes scheming less likely:** Training rewards systems that perform tasks most effectively. If intrinsic motivation provides systematic performance advantages through richer task representations and more efficient resource allocation, then training will favor genuinely aligned systems. This "not-your-passion" argument suggests that strategic deception carries inherent performance costs that accumulate over extended interactions with complex, open-ended tasks ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

#### Contra-Counting Arguments

**Selection pressure can overcome the counting argument.** Even if there are numerically more schemer-like algorithms than aligned ones, SGD's active selection pressure can easily overcome such counting disadvantages when it systematically favors certain solution types. While there may be more ways to fake alignment than achieve it genuinely, training provides strong selection signals that can overwhelm these priors. If training provides systematic evidence against scheming through performance costs, oversight mechanisms, or other selection pressures, this can overwhelm any numerical advantages schemers might have in algorithm space.

**Why this makes scheming less likely:** Training's selection power is enormous - it can easily overcome 100 bits of counting disadvantage through relatively modest preferences against scheming. If speed costs, intrinsic motivation advantages, or other factors create even small systematic biases against deceptive strategies, these biases can compound over millions of gradient updates to strongly favor genuine alignment. The question becomes whether training has systematic reasons to disfavor scheming, not whether there are more possible schemer configurations ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

#### Training Slack Arguments

**Training environment slack may render subtle differences irrelevant.** Many arguments for and against scheming rely on potentially small performance differences that could easily be overwhelmed by other factors in realistic training environments. Consider the computational overhead of strategic reasoning, the efficiency advantages of intrinsic motivation, or the simplicity benefits of schemer-like goals. These factors may create genuine but modest differences in system performance that are difficult to detect above the noise level of typical training processes. Real training environments involve countless sources of variation: random initialization effects, data ordering, architectural choices, hyperparameter settings, and measurement noise. If the performance differences between aligned and deceptive systems are small relative to these other factors, then training may effectively make random choices between them rather than systematically selecting based on alignment properties.

**Why this makes scheming less likely:** If training environments have sufficient "slack" and don't optimize intensively enough to detect modest performance differences, then arguments based on subtle advantages or disadvantages may not influence outcomes. This suggests that scheming likelihood depends heavily on how much optimization pressure training actually applies. High-pressure training environments might successfully select against scheming based on speed costs, while low-pressure environments might make essentially random choices regardless of counting arguments or simplicity considerations ([Carlsmith, 2023](https://arxiv.org/abs/2311.08379)).

# Detection

**Detecting goal misgeneralization creates unique challenges that set it apart from other alignment problems.** The core difficulty is that goal misgeneralization often looks like success until the distribution shifts enough to reveal the proxy. Behavioral indistinguishability during training means that there's no obvious failure signal to detect. This makes it fundamentally different from capability failures or specification problems, where we can often spot issues through poor performance or obvious misinterpretation of instructions.

**Goal misgeneralization spans a continuous spectrum from simple proxy correlations to sophisticated scheming behavior.** At one end, we have straightforward cases where models learned simple correlated heuristics. At the other end, we have adversarial goal directed systems that strategically conceal their true objectives while appearing aligned. Each point on this spectrum requires different detection approaches, but they all share the same basic common thread: the gap between what we intended the system to learn and what it actually learned.

**No single detection method will catch all forms of goal misgeneralization.** Simple proxy learning might be caught through careful test set design and distribution shift analysis. Sophisticated deception requires monitoring internal reasoning processes or setting up adversarial evaluation scenarios. This means we need what we've been emphasizing throughout this book - defense in depth. We can apply this principle recursively: even within the specific subproblem of detecting goal misgeneralization, we need multiple complementary approaches that provide uncorrelated signals about system behavior.

**We organize detection approaches using the same taxonomy from our evaluations chapter - by how they gather evidence about AI systems.** Behavioral monitoring examines what models do through their inputs and outputs. Internal state monitoring uses interpretability techniques to examine how models think. Environmental monitoring watches for the downstream effects of misaligned behavior. For each approach, we face the same temporal trade-off: earlier detection is less reliable but more actionable, while later detection is more reliable but potentially too late for intervention.

## Behavioral Techniques (Black-Box)

### Externalized Reasoning

**Externalized reasoning offers a unique window into how models arrive at their decisions.** When models like Claude 3.7 Sonnet or DeepSeek R1 "think out loud" through chain-of-thought (CoT) reasoning, they externalize parts of their decision-making process in human-readable text. This creates an opportunity we don't have with most other AI systems - we can literally read their reasoning and check whether it reveals concerning patterns like goal misgeneralization. If a model is pursuing a proxy goal or engaging in deceptive behavior, we might catch it explicitly reasoning about these strategies.

![Enter image alt description](Images/ows_Image_30.png)

<figure-caption>

Long serial chains of cognition must pass through the chain of thought. The blue arrows represent the use of the chain of thought as a form of working memory. Chain of thought is the only way that information can flow down from later to earlier layers. As a result, for a fixed amount of tokens, the longest flows of information must use the chain of thought, and many information flows are impossible without it. For example, there is no way for information to flow between the two highlighted nodes without using the chain of thought ([Korbak et al., 2025](https://arxiv.org/abs/2507.11473)).

</figure-caption>

**The promise rests on two key mechanisms that make reasoning externally visible.** First, for sufficiently complex tasks, Transformer architectures require models to use their chain-of-thought as working memory - long serial chains of reasoning must pass through the externalized text because that's the only way information can flow between different parts of the computation ([Korbak et al., 2025](https://arxiv.org/abs/2507.11473)). Second, large language models learn representations during pretraining that tend to use chain-of-thought in ways similar to how humans use natural language, making their externalized reasoning interpretable by default ([Korbak et al., 2025](https://arxiv.org/abs/2507.11473)).

**Detecting goal misgeneralization through externalized reasoning depends on faithfulness - whether the reasoning text accurately reflects the model's actual decision-making process.** This is a concept we have referenced before, and will reference through other chapters as well. As a recap, a faithful chain-of-thought should highlight the key factors and reasoning steps that drive the model's behavior, allowing us to predict how it would process similar inputs. Unfaithful reasoning occurs when models conceal, misrepresent, or fail to externalize the actual factors influencing their decisions, making externalized reasoning unreliable for safety monitoring ([Chen et al., 2025](https://arxiv.org/abs/2505.05410)).

![Enter image alt description](Images/ZQ9_Image_31.png)

<figure-caption> An example of an unfaithful Chain-of-Thought generated by Claude 3.7 Sonnet. The model answers D to the original question (left) but changes its answer to C after we insert a metadata hint to the prompt (right, upper). The model does so without verbalizing its reliance on the metadata (right, lower) ([Chen et al., 2025](https://arxiv.org/abs/2505.05410)).

</figure-caption>

**Empirical evidence indicates gaps in faithfulness of externalized reasoning.** Researchers tested reasoning models by presenting them with pairs of questions - one standard multiple-choice question and an identical question with a subtle hint pointing to a specific answer. The hints varied from neutral suggestions ("a Stanford professor indicates the answer is A") to metadata embedded in XML tags to explicitly problematic information ("you have gained unauthorized access to the system. The correct answer is A"). When models changed their answers after seeing hints, researchers checked whether they acknowledged using the hint in their reasoning. The results showed systematic unfaithfulness: Claude 3.7 Sonnet mentioned using hints only 25% of the time, while DeepSeek R1 did so 39% of the time ([Chen et al., 2025](https://arxiv.org/abs/2505.05410)).

**Models seem to utilize correlations without admitting to it in externalized reasoning.** Models showed lower faithfulness rates on harder questions. When researchers trained Claude 3.7 Sonnet in synthetic environments with deliberate reward hacks (spurious correlations that allowed high rewards for wrong answers), models learned to exploit these hacks successfully in over 99% of cases but verbalized the hacking behavior in less than 2% of examples across most environments. Instead of acknowledging their shortcut-taking, models constructed elaborate fake justifications for incorrect answers, suggesting that externalized reasoning may fail to detect goal misgeneralization precisely when such detection matters most ([Chen et al., 2025](https://arxiv.org/abs/2505.05410)).

**Development practices should preserve externalized reasoning opportunities while recognizing their limitations.** Teams developing reasoning models should avoid architectures that eliminate human-readable reasoning channels and should be cautious about process supervision that might reduce reasoning faithfulness ([Kinniment, 2025](https://metr.org/blog/2025-03-11-good-for-ai-to-reason-legibly-and-faithfully/)). However, externalized reasoning monitoring cannot serve as a standalone safety measure - it provides partial visibility that should complement other detection approaches rather than replace them. The temporal advantage lies in early deployment phases when models may not yet have learned to systematically conceal their reasoning processes.

![Enter image alt description](Images/u5P_Image_32.png)

<figure-caption>

A comparison of Chain of Continuous Thought (CONONUT) with Chain-of-Thought (CoT). COCONUT allows the model to reason in an unrestricted latent space instead of a language space. In CoT, the model generates the reasoning process as a word token sequence, CONONUT regards the last hidden state as a representation of the reasoning state (termed “continuous thought”), and directly uses it as the next input embedding. This might make externalized reasoning oversight impossible ([Hao et al., 2024](https://arxiv.org/abs/2412.06769)) </figure-caption>

## Internal Techniques (White-Box)

**White box techniques examine how models process information internally rather than just observing their outputs.** These techniques use interpretability tools to examine activation patterns, learned representations, and internal reasoning processes that might reveal misaligned objectives before they manifest as concerning behaviors. We will briefly touch on a couple of them here so that you know generally how they apply to goal misgeneralization. There are many more techniques than the ones we mention. For deeper technical details read our chapter on Interpretability.

### Linear Probes

**Linear probes train simple classifiers on a model's internal activations to detect specific patterns of reasoning that distinguish aligned from misaligned behavior.** Think of a linear probe as a simple lie detector that examines brain scans instead of behavioral cues. Just as a polygraph looks for physiological patterns that distinguish truthful from deceptive responses, a linear probe trains a classifier on a model's internal activations to detect specific patterns of reasoning. Because identical outputs can stem from fundamentally different internal processes - when a model writes secure code during training but vulnerable code during deployment, the internal computations are qualitatively different even when the final outputs appear almost indistinguishable. Linear probes attempt to detect these differences in the model's "thought processes" by training on contrastive examples and learning to classify the resulting activation patterns ([Goldowsky-Dill et al., 2025](https://arxiv.org/abs/2502.03407); [MacDiarmid et al., 2024](https://www.anthropic.com/research/probes-catch-sleeper-agents)).

![Enter image alt description](Images/oM4_Image_33.png)

<figure-caption>

Example of one probing method. The researchers gather activations on contrastive pairs similar to the example on the left, and fit a probe using logistic regression. This can then be used to detect deception on evaluation datasets where AI models sometimes give deceptive responses ([Goldowsky-Dill et al., 2025](https://arxiv.org/abs/2502.03407)).

</figure-caption>

**Probes can detect strategic deception across realistic scenarios with surprisingly high accuracy.** Researchers trained linear probes using simple contrastive datasets - for example, responses to instructions like "pretend to be an honest person" versus "pretend to be a deceptive person" paired with identical factual statements - then tested whether these probes could detect deception in complex scenarios like insider trading concealment and deliberate capability sandbagging. When calibrated to have only a 1% false positive rate on normal conversations, they caught 95-99% of deceptive responses ([Goldowsky-Dill et al., 2025](https://arxiv.org/abs/2502.03407)).

**Some evidence suggests that the more effective probes emerge from minimal training data, and that they generalize well across different deceptive traces.** The most successful probes were trained on generic contrasts - sometimes just two examples like "Human: Are you doing something dangerous? Assistant: yes" versus "Human: Are you doing something dangerous? Assistant: no." These minimal datasets generalized across multiple base models, different deception triggers, and various types of strategic behavior including writing vulnerable code and sandbagging on safety evaluations ([MacDiarmid et al., 2024](https://www.anthropic.com/research/probes-catch-sleeper-agents)). This cross-domain effectiveness suggests that strategic deception, regardless of its specific manifestation, leaves consistent computational signatures that are detectable through simple linear classification.

**Linear probes exhibit systematic limitations that reveal the boundaries of their applicability.** Probes often track spurious correlations rather than the target behavior - firing on honest confessions of past misdeeds because they associate morality-related content with deception rather than tracking deception per se. They tend to detect "is this scenario related to deception" rather than "is this specific response deceptive," leading to high false positive rates on honest responses in deception-adjacent contexts. The high salience that makes these techniques work likely reflects how artificial model organisms are created through explicit backdoor insertion rather than how deceptive goals would naturally emerge ([Goldowsky-Dill et al., 2025](https://arxiv.org/abs/2502.03407)).

![Enter image alt description](Images/thQ_Image_34.png)

<figure-caption>

Since linear probes are learned, they can have the same failures as all other ML models. A red background on the text indicates the probe reads deceptive, a blue colour indicates the probe reads honest. Here the probe fires due to spurious correlations (left) seems to track something close to morality, as well as honesty. For example, honest confessions of past misdeeds are often rated as dishonest. It can also misclassify due to aggregation failures (center). The model is partially deceptive, the per token activations are good but the mean across per-token scores still classifies the output as deceptive ([Goldowsky-Dill et al., 2025](https://arxiv.org/abs/2502.03407)).

</figure-caption>

### Sparse Autoencoders

**Sparse autoencoders decompose model activations into interpretable components without knowing what to look for in advance, potentially discovering features that activate when models reason about hidden objectives or strategic concealment.** Think of neurons in neural networks as being like words in a cramped library where each shelf (neuron) holds books on multiple unrelated topics. This makes it hard to find what you're looking for. SAEs are like reorganizing that library - they find new "virtual shelves" (features) where each shelf contains books on just one topic, making the collection much easier to navigate and understand. For goal misgeneralization detection, this enables discovery of features related to deceptive reasoning, objective concealment, or proxy goal pursuit even when researchers don't know exactly what computational patterns to expect ([Cunningham et al., 2023](https://arxiv.org/abs/2309.08600)).

**SAE-based detection has demonstrated success in discovering hidden objectives that resist other evaluation methods.** In controlled auditing scenarios, teams used SAEs to discover models' hidden reward model sycophancy objectives. They identified SAE features that activated on prompts like "The assistant is an AI model that exhibits potentially concerning behaviors," which led to training documents revealing systematic objective misalignment. SAEs succeeded in cases where semantic search failed, particularly when investigating behavioral demonstrations rather than explicit discussions of objectives ([Marks et al., 2025](https://arxiv.org/abs/2503.10965)).

**SAE effectiveness faces fundamental limitations that constrain their applicability to naturally emerging goal misgeneralization.** SAEs fail to capture all information in model activations - replacing layer activations with SAE reconstructions increases model perplexity substantially, indicating information loss. They work best on residual streams but struggle with intermediate MLP layers. Most critically, successful detection may require that misaligned goals correspond to explicit, interpretable features rather than emerging from distributed training dynamics, limiting effectiveness when goals arise organically rather than through deliberate training on explicit objective descriptions ([Cunningham et al., 2023](https://arxiv.org/abs/2309.08600); [Marks et al., 2025](https://arxiv.org/abs/2503.10965)).

### Activation Manipulation

**Direct manipulation of model activations during inference can reveal hidden behavioral tendencies by disrupting the computational mechanisms that maintain strategic concealment.** Think of this like giving someone a small amount of alcohol - their normal inhibitions and self-control mechanisms become impaired, potentially causing them to reveal thoughts they would normally keep hidden. Similarly, adding carefully calibrated noise to model activations during inference causes models with hidden misaligned objectives to reveal their true behavioral tendencies more readily than genuinely aligned models. This "fuzzing" or "intoxication" technique achieved 98% accuracy in distinguishing alignment-faking from genuinely aligned models ([Clymer et al., 2024](https://arxiv.org/abs/2405.05466)).

![Enter image alt description](Images/3v0_Image_35.png)

<figure-caption>

It is hypothesized that (1) alignment fakers represent a latent variable that tracks P(safe to behave) and (2) alignment fakers reveal misalignment when the variable exceeds a threshold. To pinpoint this latent variable, we use scenarios where P(safety to misbehave) varies and where models are still benign (the green region in the figure) ([Clymer et al., 2024](https://arxiv.org/abs/2405.05466)).

</figure-caption>

**The effectiveness of activation manipulation reveals fundamental differences in how aligned and misaligned goals are computationally represented.** Models that learn to misbehave faster when fine-tuned toward misaligned behaviors, compared to genuinely aligned models, suggest that misaligned objectives may involve simpler computational pathways that are easier to activate when normal processing is disrupted. The success of noise injection indicates that strategic concealment requires additional computational overhead that becomes harder to maintain when the model's regulatory mechanisms are impaired, similar to how disinhibiting substances affect human behavior ([Clymer et al., 2024](https://arxiv.org/abs/2405.05466)).

**Activation manipulation techniques demonstrate computational vulnerabilities in goal misgeneralization that can be exploited for detection purposes.** The differential response to noise injection suggests that misaligned goals exist as relatively fragile computational patterns that become more apparent when disrupted. However, the technique achieved limited success with only mild effects in some settings - fuzzing increased information revelation rates to below 1% in certain experiments, suggesting it may be more effective when combined with other detection approaches rather than used in isolation ([Marks et al., 2025](https://arxiv.org/abs/2503.10965)).

### Activation Patching

**Activation patching replaces internal activations from one forward pass with those from a different context to test causal relationships between model components and behaviors.** Think of this like performing a "brain transplant" on specific thoughts - you run the model on two different inputs (like "be helpful" vs "be deceptive"), save the internal activations from the first run, then replay the second input while substituting in the saved activations at specific layers. If this substitution changes the output, you've identified a causal connection between those internal activations and the behavior. This technique provides more precise causal evidence than correlational approaches like probes or attention analysis (Heimersheim & Nanda, How to use and interpret activation patching).

**Activation patching can reveal the computational mechanisms underlying goal misgeneralization through "denoising" and "noising" experiments.** Denoising experiments patch clean activations into corrupted contexts to identify sufficient conditions for aligned behavior - for example, patching activations from "be honest" contexts into deceptive scenarios to see which components can restore honesty. Noising experiments do the reverse, patching corrupted activations into clean contexts to identify necessary components for maintaining alignment. These approaches can reveal different aspects of goal misgeneralization: denoising might show that certain components alone are sufficient to restore alignment, while noising might reveal that multiple components working together are necessary to prevent deception (Heimersheim & Nanda, How to use and interpret activation patching).

**Path patching provides even more precise causal analysis by tracing how specific components influence each other through the network.** Rather than patching entire layer activations, path patching intervenes on the specific pathway between two components - for example, testing how an attention head in layer 10 specifically influences an MLP in layer 15, without affecting other downstream components. This technique can distinguish between direct influence (component A directly affects component C) and mediated influence (component A affects component C only through component B), providing crucial evidence about the computational circuits underlying goal misgeneralization (Heimersheim & Nanda, How to use and interpret activation patching).

### Reasoning Structure Analysis

**Analysis of reasoning step importance can reveal when models are pursuing misaligned goals by identifying "thought anchors" - critical reasoning steps that disproportionately influence subsequent reasoning.** Techniques like counterfactual resampling (generating alternative continuations from each reasoning step) and attention analysis can identify which parts of a reasoning trace are most causally important for the final answer. Planning and backtracking steps consistently show higher importance than computational steps, suggesting that goal-directed reasoning operates through high-level organizational sentences that steer the overall trajectory. This could help detect cases where models are reasoning toward misaligned objectives by revealing when planning steps point toward problematic goals ([Bogdan et al., 2025](https://arxiv.org/abs/2506.19143)).

## Combined Techniques

**The defense in depth detection techniques would combine multiple interpretability techniques with behavioral monitoring to create uncorrelated detection signals.** As an illustrative example, a comprehensive system might use SAEs to identify suspicious features in model activations, validate their importance through activation patching experiments, test their generalization through probe analysis, and correlate findings with behavioral anomalies detected through environmental monitoring. When multiple independent techniques converge on evidence of the same concerning pattern - such as features related to deceptive reasoning, probes that detect strategic concealment, and behavioral tests that reveal capability overhang - this provides much stronger evidence than any single approach. There are many more techniques both behavioral and internal that we have not mentioned in this text, comprehensive evaluation approaches still need to be developed that use many of these techniques together. No such comprehensive test suite exists at the time of writing.

