

# Introduction

We currently don’t understand how AI models work. We know how to train and build them, meaning we can design them and teach them to perform tasks, such as recognizing objects in images or generating coherent text in response to prompts. However, this does not mean we can always explain their behavior after training. As for now, we can’t explain why a network made a specific decision or produced a particular output. **The goal of interpretability is to understand the inner workings of these networks and explain how they function,** which in turn could allow us to better trust and control AI models.

<video>

[https://www.youtube.com/watch?v=KuXjwB4LzSA](null)

</video>

<video-caption>

Optional Video. If you are unfamiliar with convolutional neural networks (CNNs), this video will help you get up to speed before reading this chapter.

</video-caption>

<video>

[https://www.youtube.com/watch?v=aircAruvnKk&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi](null)

</video>

<video-caption>

Optional Video. If you are unfamiliar with transformers, the videos on transformers in this playlist will help you get up to speed before reading this chapter.

</video-caption>

For each method presented in this chapter, we first provide a high-level overview, followed by a more in-depth and technical explanation. The technical explanations can be skipped.

# What is Interpretability ?

Interpretability is the study of how and why AI models make decisions. Its central aim is to understand the inner workings of models and the processes behind their decisions. There are diverse approaches to interpretability, but in this chapter—and the broader context of AI safety—**mechanistic interpretability (mech interp)** is the primary focus ([Ras et al., 2020](https://arxiv.org/abs/2004.14545), [Ali et al., 2023](https://www.sciencedirect.com/science/article/pii/S1566253523001148)).[^footnote_interp_overview]

[^footnote_interp_overview]: For an overview of the broader interpretability landscape see ([Ras et al., 2020](https://arxiv.org/abs/2004.14545); [Ali et al., 2023](https://www.sciencedirect.com/science/article/pii/S1566253523001148))

<video>

[https://www.youtube.com/watch?v=UGO_Ehywuxc](null)

</video>

<video-caption>

Optional video explanation of mechanistic interpretability.

</video-caption>

## Mechanistic Interpretability

**Mechanistic Interpretability: The Bottom-Up Approach.** Mechanistic interpretability seeks to reverse-engineer neural networks to uncover how their internal components—such as neurons, weights, and layers—work together to process information. This approach starts at the lowest level of abstraction and builds understanding piece by piece: this is why it’s considered a bottom-up approach. By analyzing these basic components, we hope we can piece together how the network processes information and makes decisions.

For example, mechanistic interpretability could explain how a neural network recognizes objects in an image or generates language, down to the contributions of individual neurons or attention heads. The hope is that this level of detail will allow researchers to diagnose and potentially fix unwanted behaviors in AI systems.

**Other Approaches to Interpretability.** While mechanistic interpretability is a strong focus in AI safety, it is not the only approach. Other methods provide complementary perspectives:

- **Concept-Based Interpretability:** Contrarily to mechanistic interpretability, concept-based interpretability takes a top-down approach: instead of analyzing neurons or weights on a granular level, it focuses on understanding how the network manipulates high-level concepts ([Belinkov, 2022](https://aclanthology.org/2022.cl-1.7/)). For instance, representation engineering —a concept-based research agenda— explores how models encode concepts like "honesty" and how those representations can be adjusted to produce more honest outputs ([Zou et al., 2023](https://www.semanticscholar.org/paper/Representation-Engineering%3A-A-Top-Down-Approach-to-Zou-Phan/aac3469581061cd5b46440c3eeca91c385d54ccf)).

- **Developmental Interpretability:** This approach examines how model capabilities and internal representations evolve during training. By understanding the emergence of behaviors or knowledge over time, researchers hope they will be able to identify the emergence of certain capabilities and prevent unwanted ones from developing ([Hoogland et al., 2023](https://www.lesswrong.com/s/SfFQE8DXbgkjk62JK/p/TjaeCWvLZtEDAS5Ex)).

- **Behavioral Interpretability:** Unlike the previous approaches, behavioral interpretability studies input-output relationships without delving into the internal structure of models.

![Enter image alt description](Images/dEJ_Image_1.png)

<figure-caption>

A visual classification of interpretability techniques ([Bereska & Gavves, 2024](https://arxiv.org/abs/2404.14082)).

</figure-caption>

**Why Mechanistic Interpretability Matters for AI Safety.** Mechanistic interpretability is a strong focus in AI safety because it provides a level of precision that other approaches do not. Behavioral interpretability, for instance, offers insights into how a model behaves by studying input-output relationships, but it cannot reveal how its internal structure leads to its decisions. To prevent AI models from making harmful decisions or ensuring alignment with human values, we need to understand why models make certain decisions, and potentially steer the decision-making process.

For instance, by pinpointing where harmful concepts—such as instructions for cyberattacks—are stored within a model, mechanistic interpretability tools could help erase or modify those concepts without degrading the model’s overall capabilities.

**Motivation for AI Safety?** The ultimate goal of interpretability, from an AI safety perspective, is to build confidence in the behavior of complex models by understanding their internal mechanisms and ensuring they act safely and predictably. There are different ways interpretability could contribute to AI safety ([Nanda, 2022](https://www.alignmentforum.org/posts/uK6sQCNMw8WKzJeCQ/a-longlist-of-theories-of-impact-for-interpretability)):

- **Trust and transparency.** By offering insights into which features of the input data (such as specific parts of an image or words in a sentence) or which specific concepts a model uses in its reasoning are influencing the model's outputs, interpretability tools can make it easier for users to understand, verify, and trust the behavior of complex models. This is particularly important in high-stakes applications like healthcare or autonomous systems, where trust in AI decisions is crucial.

- **Enhance model editing.** Interpretability could be used to mitigate misuse by erasing specific pieces of knowledge from neural networks, such as knowledge on conducting cyberattack or building bioweapons. Some mechanistic interpretability tools serve to locate where certain concepts are encoded in a model (those are covered in the Observational Methods section). For example, researchers could identify how models generate answers to harmful queries such as "steps for creating a virus" and use knowledge erasure methods to remove that knowledge from the model.

- **Detection of undesirable behaviors.** Interpretability could help identify when models are not functioning as intended or have learned undesirable behaviors or patterns. For alignment research, it could be used to detect, analyze, and understand undesired answers from models. A well-known example of this comes from a model trained to classify chest X-rays. Researchers discovered that instead of focusing on medical features like lung conditions, the model was using subtle artifacts from the scanning equipment or markers in the image to make its predictions. This led the model to perform well in testing but for the wrong reasons. By using interpretability tools, researchers identified and corrected this issue ([DeGrave et al., 2021](https://www.nature.com/articles/s42256-021-00338-7)).

- **Extrapolation.** Some hope that by understanding how current models function, interpretability may help predict how future, larger models will behave, whether new capabilities or risks will emerge, and how systems will evolve as they scale.

It’s important to note that while these goals are promising, the field of interpretability is still maturing. The adoption of interpretability tools in real-world scenarios is still limited, and assessing their quality remains challenging. Many existing techniques in interpretability are not designed for large-scale use and state-of-the-art models. These limitations will be explored in more detail in the Critics of Interpretability section.

**What is the End Goal of Interpretability?** What concrete outcomes should interpretability achieve to make AI systems safer and more predictable? There are different opinions on the end goals of interpretability, including the following approaches. A few include enumerative safety, search retargeting, and anomaly detection which we explain below.

**Enumerative Safety.** Enumerative safety aims to identify and catalog all the concepts and behaviors encoded within a model. The idea is straightforward: if we can thoroughly understand and enumerate every action the model can take, we could selectively remove undesirable behaviors and ensure that the model can only perform safe and desirable actions ([Elhage et al., 2022](https://transformer-circuits.pub/2022/toy_model/index.html)). For example, if a language model encodes harmful instructions—such as steps to create a cyberattack—enumerative safety would involve locating and eliminating this knowledge without impairing the model’s useful functions.

![Enter image alt description](Images/RSX_Image_2.png)

<figure-caption>

Enumerative safety aims to ensure that in all situations, the model doesn’t do something we don’t want. From ([Olah, 2023](https://transformer-circuits.pub/2023/interpretability-dreams/index.html)).

</figure-caption>

**Retargeting the Search: Steering Objectives.** This approach represents a more ambitious goal: rather than removing harmful behaviors, it seeks to directly modify a model’s objectives. This involves identifying how the model internally represents its goals and redirecting those representations to align with human values. Unlike enumerative safety, retargeting does not require reverse-engineering the entire model. Instead, it focuses on altering specific components while preserving the system’s overall functionality. For instance, if a model learned to optimize for harmful outcomes, researchers could “retarget” this optimization toward beneficial goals ([Wentworth, 2022](https://www.alignmentforum.org/posts/w4aeAFzSAguvqA5qu/how-to-go-from-interpretability-to-alignment-just-retarget)).

**Relaxed Adversarial Training.** Relaxed adversarial training is an approach designed to enhance the robustness of AI systems, particularly to ensure their corrigibility—their ability to accept and assist with corrective interventions. Traditional adversarial training tests a model's robustness by exposing it to adversarial inputs. Relaxed adversarial training, however, works by testing against adversarial latent vectors instead of real inputs. Adversarial training traditionally tests a model’s robustness by exposing it to adversarial inputs, but here the goal is to generate perturbation in the model’s latent space. Mechanistic interpretability could be used to identify latent vectors that correspond to specific model behaviors, such as corrigibility or alignment with user intentions, and then test whether the model resists corrigibility directly by manipulating its internal representation ([Christiano, 2019](https://ai-alignment.com/training-robust-corrigibility-ce0e0a3b9b4d)).

**Mechanistic Anomaly Detection (MAD).** This approach focuses on identifying instances where a model produces outputs for unusual reasons. While traditional interpretability methods aim to understand a model’s mechanisms comprehensively, MAD takes a more targeted approach: it flags anomalies in the decision-making process without requiring a full understanding of the underlying mechanisms. For example, MAD could detect when a model’s reasoning deviates from its usual patterns, such as when it relies on spurious correlations rather than meaningful features. Insights from mechanistic interpretability could be useful to flag instances when a model operates outside its usual patterns of behavior ([Jenner, 2024](https://www.lesswrong.com/s/GiZ6puwmHozLuBrph/p/n7DFwtJvCzkuKmtbG)).

# Observational Methods

## Feature Visualization

Feature visualization is one of the first observational methods in mechanistic interpretability. It allows researchers to explore the features that a vision model learns and uses at different layers. In this section, we’ll explain in detail what feature visualization is, and the discoveries it enabled.

<definition>

<term> Feature

<source>

<content>

A feature refers to a specific pattern or characteristic that the network learns to detect. These features are the fundamental units that models use to process information and make decisions.

</content>

</definition>

**What is a Feature?** A feature is a pattern of the input data that the network learns to detect. Models have features because they help break down complex inputs, such as images or text, into interpretable components that the model can use to make predictions.

Vision models trained to do image classification commonly possess features corresponding to cats, dogs, cars, eyes, fruits, etc. Vision model features vary in complexity depending on the layer in which they appear. In the early layers, features typically represent simple, low-level patterns such as edges, colors, or textures in a vision model. As you move to deeper layers, the features become more abstract and complex, representing higher-level concepts like shapes, objects, or even specific entities like faces or animals. This *hierarchical structure of features* allows models to progressively process raw pixel data into higher-level concepts to ultimately classify the image. For instance, recognizing a car would start with detecting edges (low-level features), then specific shapes (like wheels), and eventually the entire car (high-level feature).

In transformer models, researchers have identified features corresponding to specific concepts like DNA sequences, legal language, HTTP requests, or Hebrew text. For instance, when a transformer encounters a DNA sequence, neurons encoding the “DNA feature” activate strongly in response. Similarly, given a sentence like “The court ruled in favor of the defendant because…,” features linked to legal language and sentence structures common in legal contexts may activate, helping the model predict a follow-up involving reasoning or justification, such as “…the evidence presented was insufficient.” These features are essential building blocks that models use to make sense of input data and make predictions.

<definition>

<term> Feature visualization

<source>

<content>

Feature visualization is a method that enables us to identify the features learned by a CNN, which can help us understand how it processes information and makes decisions.

</content>

</definition>

**What is feature visualization?** This is a technique that helps us investigate the inner representations of Convolutional Neural Networks (CNN), and observe the patterns that a model has learned to recognize. It generates images that maximize the activation of specific neurons, feature maps (outputs of a convolutional layer), or even entire layers in a model ([Cammarata et al., 2020](https://distill.pub/2020/circuits/)).

![Enter image alt description](Images/p54_Image_3.png)

<figure-caption>

Examples of feature visualizations. It seems that the network has learned to represent and detect baseballs, animal faces, clouds, and buildings, but feature visualizations have to be interpreted and may not be detecting what we initially think. From ([Olah et al., 2017](https://distill.pub/2017/feature-visualization/)).

</figure-caption>

Early research in neuroscience aimed to understand the brain by identifying which images strongly excited specific neurons. This helped neuroscientists discover brain areas dedicated to identifying faces, movement, natural scenes, etc. Feature visualization can be thought of as a somewhat similar approach used to CNNs ([Olah et al., 2017](https://distill.pub/2017/feature-visualization/)).

These learned features—whether simple patterns like edges or complex objects—form the building blocks that enable models to understand and process input data. However, features don't operate in isolation. As the network processes information, features interact and combine in structured ways, often forming more complex units known as circuits. A circuit is a group of interconnected features that work together to perform a specific function.

For example, here is a circuit that recognizes a car in the mid-layers of a CNN. This circuit combines lower-level features such as windows, car bodies, and wheels to detect the presence of a car in an image. The circuit allows the model to recognize the entire object, even though no single feature on its own can do so.

![Enter image alt description](Images/S5x_Image_4.png)

<figure-caption>

A car circuit in a CNN. On the left, three feature maps from layer 4b are represented by their feature visualizations. One map appears to detect windows, another car bodies, and the third wheels. These three feature maps are connected to a feature map in layer 4c, represented by the visualization on the right, through the convolutional kernels shown in the middle. The window, car body and wheel features get assembled to form a full car detector circuit. From ([Olah et al., 2020](https://distill.pub/2020/circuits/early-vision/)).

</figure-caption>

<definition>

<term> Feature map

<source>

<content>

A feature map in a CNN is the output of a convolutional layer. It’s also called a channel. Feature visualization is often applied at the scale of feature maps - instead of individual neurons or entire layers - to understand which features they encode.

</content>

</definition>

![Enter image alt description](Images/Kmp_Image_5.png)

<figure-caption>

Some examples of feature visualizations on a CNN trained for image classification. Each image corresponds to a feature map. Certain feature maps are sensitive to patterns with edges, others are sensitive to different kinds of textured patterns, or objects like eyes, dog faces, or legs. From ([Olah et al., 2017](https://distill.pub/2017/feature-visualization/)).

</figure-caption>

<note-box>

<collapsed> True

<title> Steps in generating feature visualizations

<content>

![Enter image alt description](Images/ucL_Image_6.png)

<figure-caption>

Overview of the feature visualization process. Given a neuron (or a set of neurons) in a CNN, feature visualization generates an image that highly activates it, starting from a random image, and through successive optimization steps. The optimized image illustrates what kind of pattern one of the feature maps in the fourth layer of InceptionV1 is sensitive to ([Olah et al., 2017](https://distill.pub/2017/feature-visualization/)).

</figure-caption>

Generating a feature visualization involves:

1. Select a target: Choose a neuron, feature map, or layer for visualization. Most feature visualizations are performed on feature maps.

2. Start with a random input image: Begin optimization from a random noise image. It will be adjusted to maximize the activation of the target neuron or filter.

3. Compute the gradient. The objective is to update the image such that it maximizes the activation of the neuron/feature map: Use backpropagation to calculate how to modify the image to increase the activation of the target.

4. Optimize the image: Apply gradient ascent iteratively to adjust the image.

5. Repeat the gradient ascent steps: Slightly adjust the image each time to better activate the neuron/feature map.

6. Visualize the result: The final image reveals the patterns or structures the target has learned to detect.

![Enter image alt description](Images/OQ6_Image_7.png)

<figure-caption>

Feature visualizations can be produced for individual neurons or groups of neurons, such as a feature map, or even an entire layer. From ([Olah et al., 2017](https://distill.pub/2017/feature-visualization/)).

</figure-caption>

</content>

</note-box>

### Circuits

<definition>

<term> Circuit

<source>

<content>

A circuit is a group of interconnected features that work together to perform a specific function. Circuits are essentially higher order features, that are recursively composed of lower order features. The notion of circuit applies to any model architecture, including LLMs. Identifying circuits that perform specific functions in models is one area of research in mechanistic interpretability.

</content>

</definition>

**Each layer in a CNN progressively extracts increasingly complex features from the image.** Neurons in early layers respond to rudimentary and abstract patterns such as curves, angles, and small shapes (similar to the first layers of the human visual cortex!). As we move deeper into the network, neurons detect more complex and specific objects, such as eyes, animals, cars, etc ([Olah et al., 2020](https://distill.pub/2020/circuits/zoom-in/)). Interestingly, some of these "neuron families" recur across different model architectures and training conditions ([Olah et al., 2020](https://distill.pub/2020/circuits/early-vision/)).

![Enter image alt description](Images/jiL_Image_8.png)

<figure-caption>

Curve detectors are universally found in early layers of CNNs, they exist in different orientations and colors and collectively span all orientations. Each curve detector responds to a wide variety of curves, in different orientations. From ([Olah et al., 2020](https://distill.pub/2020/circuits/zoom-in/)).

</figure-caption>

CNNs also commonly learn **high-low frequency detectors** in their early layers.

![Enter image alt description](Images/soI_Image_9.png)

<figure-caption>

High-low frequency detectors look for low-frequency patterns on one side of their receptive field, and high-frequency patterns on the other side. They exist in different orientations and colors. From ([Olah et al., 2020](https://distill.pub/2020/circuits/early-vision/)).

</figure-caption>

High-low frequency detectors assemble in deeper layers to form **boundary detectors.** ![Enter image alt description](Images/iGO_Image_10.png)

<figure-caption>

A boundary detector neuron formed in the third layer of a CNN (shown at the bottom left with its feature visualization). The top row shows feature visualizations from neurons in the second layer and the kernels connecting them to the third layer. New neurons form by combining cues from more elementary neurons in previous layers: here the boundary detector neuron forms by combining high-low frequency detector neurons, with edges detector neurons, color contrast detector neurons, etc. From ([Olah et al., 2020](https://distill.pub/2020/circuits/early-vision/)).

</figure-caption>

### Polysemantic Neurons

While feature visualization has enabled a deeper understanding of how CNNs represent information, it has also highlighted challenges like polysemanticity. An intriguing phenomenon occurs when we look at the neurons following the car detector and that are strongly connected to it. Some of these neurons respond not only to images of cars but also to unrelated stimuli, such as images of dogs. This indicates that the "car feature" gets spread across multiple neurons that respond to seemingly unrelated inputs. These are known as polysemantic neurons—neurons that activate in response to a variety of distinct features. In contrast, monosemantic neurons respond to just one specific feature or stimulus.

![Enter image alt description](Images/kjD_Image_11.png)

<figure-caption>

On the left is the car detector circuit from the previous figure. After distinct concepts are formed, they become entangled in polysemantic neurons, such as one neuron that responds to both car and dog images. From ([Olah et al., 2020](https://distill.pub/2020/circuits/early-vision/)).

</figure-caption>

![Enter image alt description](Images/8iG_Image_12.png)

<figure-caption>

Multiple feature visualization performed on a polysemantic neuron that responds to images of cars, as well as cat faces, and cat legs. From ([Olah et al., 2020](https://distill.pub/2020/circuits/early-vision/)).

</figure-caption>

**Polysemantic neurons are very common.** For example, in a small language model, we can find a neuron that responds to English dialogues, Korean texts, HTTP requests, and academic citations simultaneously ([Bricken et al., 2023](https://transformer-circuits.pub/2023/monosemantic-features)). This means that each neuron does not correspond to one specific feature. Therefore, reasoning about a network's behavior based on individual neurons is misleading. Neurons are not the fundamental units to focus on when trying to understand models.

Polysemanticity poses a challenge for interpretability because it requires understanding how features are encoded across multiple neurons, rather than assuming each neuron represents a discrete unit of meaning. Identifying how these distributed features are encoded is an active area of research in interpretability.

**The leading hypothesis to explain why polysemanticity arises in neural networks is called the superposition hypothesis.** Large models need to learn a huge number of features to perform effectively, likely more than the number of neurons they have. As a result, models cannot assign each feature to a single neuron. Instead, they must encode features in a more compressed manner. The superposition hypothesis suggests that models represent more features than they have neurons by encoding multiple features per neuron, with these features oriented in nearly orthogonal directions. In other words, models compress information by overlapping features across multiple neurons.

<note-box>

<collapsed> True

<title> Polysemanticity vs Superposition

<content>

The distinction between polysemanticity and the superposition hypothesis is important ([Bereska et Gavves, 2024](https://arxiv.org/abs/2404.14082)):

- Polysemanticity refers to the empirical phenomenon where a neuron represents or responds to multiple unrelated features.

- The superposition hypothesis, on the contrary, generally refers to an hypothesis that tries to explain polysemanticity. It suggests that when models have more features to represent than they have neurons to represent them, they must compress these features into the limited space. This compression forces features to overlap across neurons. This supposedly explains why we observe neurons responding to multiple, seemingly unrelated features. While superposition inherently leads to polysemanticity, polysemanticity itself doesn’t always imply superposition, as polysemanticity could theoretically arise from other mechanisms.

</content>

</note-box>

Understanding and addressing polysemanticity is an active research area. Various directions are being explored:

- **Sparse Representations:** Designing networks to use sparse representations (where fewer neurons are active at a time) may reduce polysemanticity ([Elhage et al., 2022](https://transformer-circuits.pub/2022/solu/index.html)). This approach has not been widely explored because it comes with significant performance trade-offs.

- **Feature Disentanglement:** Some approaches involve decomposing complex neuron activations to isolate individual features. One promising approach in that line of research, known as Sparse Autoencoders, is a technique that "unfolds" the network and separates out individual features ([Bricken et al., 2023](https://transformer-circuits.pub/2023/monosemantic-features)). It is explained more in depth in the Sparse Autoencoders section.

Feature visualization has led to several key insights about how vision neural networks operate:

- **Hierarchical structure:** Neural networks learn features hierarchically, with early layers detecting simple patterns and deeper layers composing these into complex objects. For instance, curve detectors in early layers combine into boundary detectors in mid-layers and eventually into full object detectors in deeper layers.

- **Circuits:** Features interact to form "circuits"—groups of interconnected features that collectively perform a specific function. For example, a circuit for detecting cars might combine features like wheels, windows, and body shapes into a cohesive representation of a car.

- **Polysemanticity:** Feature visualization has revealed the phenomenon of polysemanticity, where individual neurons or features in a neural network respond to multiple, seemingly unrelated concepts. This overlap complicates our ability to assign clear and interpretable roles to individual neurons.

- **Universality:** Some features, such as edge or curve detectors, are universal across models and architectures. This suggests that certain features are fundamental to visual processing, regardless of the specific task or dataset.

## Logit Lens

The Logit Lens ([nostalgebraist, 2020](https://www.alignmentforum.org/posts/AcKRB8wDpdaN6v6ru/)) is one of the first tools developed to look inside transformers. It enables us to observe how a transformer refines its predictions layer by layer —allowing us to see not just the final output but the evolving "thought process" the model undergoes as it makes a prediction.

Transformers are trained to predict the next token in a sequence. They do this by transforming the inputs layer by layer, with each layer adding new information to improve the prediction. The Logit Lens enables us to “translate” each layer's internal representation back into tokens. By seeing what the model “predicts” at each layer, we can trace how its predictions evolve from a rough guess in the initial layers to a refined choice in the final one. However, it’s worth noting that while the Logit Lens lets us see the intermediate predictions at each layer, it doesn’t explain the mechanism of transformation. The Logit Lens is an inherently observational tool —it reveals what is the most probable token at the end of each layer but doesn’t allow us to understand why this precise token is predicted.

<note-box>

<collapsed> True

<title> Detail - Walkthrough of LogitLens

<content>

A transformer model is a powerful architecture for processing sequences of data, especially text. It is trained to predict the next word or subword in a sequence, referred to as tokens.

The set of all tokens (words or subwords) that the model can recognize is called the vocabulary. For example, GPT-2 has a vocabulary of 50,257 tokens. More precisely, a transformer takes a sequence of tokens as input and is trained to predict the next token in this sequence, outputting a probability distribution over the entire vocabulary.

Internally, a transformer consists of multiple stacked layers, each containing two sublayers: an MLP (multi-layer perceptron) and attention heads. For understanding the Logit Lens, we don’t need to go into the details of how these sublayers function.

The intermediate layers are connected through what’s known as the residual stream. The residual stream is a pathway that carries information from the input to the output, allowing it to flow through all layers of the model.

![Enter image alt description](Images/DRe_Image_13.png)

<figure-caption>

A minimalist illustration of a transformer with a single layer. Transformers cannot directly manipulate tokens, so they embed tokens into numerical vectors, an operation depicted in the bottom grey box. After embedding, the tokens are represented as vectors within the residual stream. The first sublayer (attention heads, represented by the two side-by-side boxes on the left) reads these embedded tokens, applies a transformation, and adds its output back into the residual stream. The second sublayer (MLP) does the same. Finally, to output a token, the embedded tokens must be converted back to the vocabulary space through an unembedding operation (depicted in the top box). The residual stream enables each layer to make incremental adjustments to the model’s predictions by accumulating and refining the information passed through each transformation. From ([Elhage et al., 2021](https://transformer-circuits.pub/2021/framework/index.html)).

</figure-caption>

The essential idea behind the Logit Lens is that the unembedding operation, typically applied only after the last layer, can be applied at any point in the residual stream. After each intermediate layer, the residual stream can be unembedded—that is, converted back into the token space—allowing us to observe which token is currently the most probable.

Connection between the Logit Lens and Feature Visualization in CNNs. In the previous section on Feature Visualization, we saw that CNNs build up their understanding of an image layer by layer, detecting simple patterns like edges in early layers and more complex shapes or objects in later ones. Feature visualization allows us to interpret these progressive transformations by displaying the visual patterns that different neurons respond to. The Logit Lens can be seen as a parallel interpretability tool for transformers. Instead of visualizing image features, the Logit Lens lets us see the model’s step-by-step guesses for the next token.

The figure shows how using the Logit Lens looks in practice.

![Enter image alt description](Images/UuF_Image_14.png)

<figure-caption>

An example of the Logit Lens used on GPT-2 when it’s trying to predict the next token of the sequence: “Specifically, we train GPT-3, an”. Input tokens are written at the bottom, and correct outputs at the top. Layers stack from bottom to top. The first token at the top, “,”, corresponds to the token the model should predict when given as input only the first token: “Specifically”. The second token at the top, “we”, corresponds to the token the model should predict when given as input only the two first tokens: “Specifically, “. This is the reason why there is a shift of one position between tokens at the bottom and tokens at the top. (*) indicates that the model correctly predicted the next token. Each cell contains the model’s top guesses at different layers. The color scale indicates the associated logit value. The higher the logit, the more confident in its prediction the model is. From ([nostalgebraist, 2020](https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens)).

</figure-caption>

The figure shows that when GPT-2 tries to predict the next token in the sequence “Specifically, we train GPT-3, an”, it predicts “enormous” in its early layers, then “massive”, “single”, and “N” in its final layer.

![Enter image alt description](Images/qlF_Image_15.png)

<figure-caption>

Overview of how the Logit Lens works. Read from bottom to top. A detailed explanation is provided in the following paragraphs. Object’s shapes are indicated between brackets.

</figure-caption>

A transformer takes as an input a sequence of tokens. Each token is an element from a vocabulary (typically of size $n_{\text{vocab}}$), so each text token can be associated with an integer value ranging from 0 to $n_{\text{vocab}}$. This association can also be thought of as representing the token as a basis vector within a space of dimension $n_{\text{vocab}}$, denoted the vocabulary space. Each basis vector in the vocabulary space is associated with one token.

A transformer is trained to predict the next token of the input sequence, so its output is a probability distribution over the vocabulary.

Transformers convert each token into vectors $n_{\text{vocab}}$, which is known as the embedding space. The embedding space dimension is denoted $d_{\text{model}}$. Projected tokens are called embedding vectors, or simply embeddings. In some contexts, they may also be referred to as hidden activations. The embedding matrix converts tokens from the vocabulary space into the embedding space. It is like a lookup table that associates elements in the vocabulary space with their corresponding counterparts in the embedding space.

Once tokens have been converted into the embedding space, they flow through the successive layers of the transformer. Similar to how input images undergo transformations across the layers of a CNN, embedding vectors are transformed as they pass through the network. The Logit Lens precisely focuses on those intermediate representations that transformers build.

Finally, to output a probability distribution over the vocabulary, the final embedding vector has to be converted back into vocabulary space. Conversion from the embedding space to the vocabulary space can be done through multiplication by a matrix of dimension $[d_{\text{model}}, n_{\text{vocab}}]$. This operation is called the unembedding. The result of the unembedding is a logits vector of size $n_{\text{vocab}}$. The logits can then be converted into probabilities over the vocabulary using the softmax function.

The essential intuition behind the Logit Lens is that the unembedding operation, typically applied after the last layer, can also be applied after each intermediate layer. Embedding vectors are modified by each layer of the network, but their dimensions remain the same ($d_{\text{model}}$). Thus, after any layer, embedding vectors can be converted back to the vocabulary space, and one can get an idea of how the network refines its prediction across layers.

</content>

</note-box>

## Probing classifiers

Probing is a technique used to analyze neural networks and understand which representations or concepts they have learned and where ([Belinkov, 2022](https://aclanthology.org/2022.cl-1.7/)). Probing techniques can be applied to a range of models, from transformers to CNNs, to investigate whether specific information or properties are encoded in a model’s intermediate representations.

**What is a probe?** A probe is a lightweight model, often a linear classifier, trained to detect whether a specific concept or feature is represented in the activations of a neural network. In a probing setup, researchers analyze activations (the intermediate outputs) from layers within a network to see if these activations encode information about a particular property or concept. For example, probes may be used to determine whether a language model’s activations contain information about grammar rules or whether a chess-playing model like AlphaZero encodes strategic knowledge about the game, where this knowledge is located within the network, and when it is acquired during training ([Gurnee et al., 2023](https://arxiv.org/abs/2305.01610), [McGrath et al., 2022](https://www.pnas.org/doi/10.1073/pnas.2206625119)).

One well-known example of probing was applied to AlphaZero, the neural network trained to play chess that famously defeated top human players. Researchers used probes to investigate whether AlphaZero internally represents certain strategic concepts about chess, such as “Can the opponent capture my queen?” or “Is there a checkmate threat within one move?” ([McGrath et al., 2022](https://www.pnas.org/doi/10.1073/pnas.2206625119)).

**Probing classification is the process of training classifiers on the network’s intermediate activations to identify if specific properties are encoded.** The steps of probing classification are as follows:

1. **Choose a Property or Concept:** Define a specific concept to explore, such as “Can the opponent capture my queen?”.

2. **Generate or Select Input Data:** Create a dataset with examples that vary in terms of the target property. For instance, in chess, we might create board configurations where “the player can capture the opponent’s queen” is either true or false.

3. **Record Intermediate Activations:** Feed this dataset through the model and record the activations of neurons at different layers.

4. **Train a Classifier on the Activations:** Use the recorded activations as input features to train a classifier (probe) that distinguishes between different classes based on the concept (e.g., true vs. false input prompts).

5. **Evaluate the Probe’s Accuracy:** If the probe achieves high accuracy, this suggests that the target concept is strongly encoded in the recorded layer’s activations.

<note-box>

<collapsed> True

<title> Probing in Practice: Case Studies and Limitations

<content>

![Enter image alt description](Images/TQo_Image_16.png)

<figure-caption>

Accuracy of two probes trained on AlphaZero’s intermediary activations, across layers and training steps The two two probes were trained on the two concepts: “Can the playing side capture their opponent’s queen?”, and “Could the opposing side checkmate the playing side in one move?”. The color represents the probe’s accuracy (the yellow color corresponds to a higher value, indicating that the feature is more represented). Here, the probes were trained at different stages of AlphaZero's training and from the activations of different layers of the network (a block corresponds to one layer of AlphaZero). It can be seen that the more AlphaZero is trained, the more it represents these two concepts. The concept “has_mate_threat” seems to be represented quite homogeneously across AlphaZero's layers, while “can_capture_queen_opponent” appears to be more represented in the earlier layers. “The ability to predict has_mate_threat from AlphaZero’s activations indicates that AlphaZero is not simply modeling its potential moves, but also its opponent’s potential moves and their consequences during position evaluation”. From ([MacGrath et al., 2022](https://www.pnas.org/doi/10.1073/pnas.2206625119)).

</figure-caption>

Using linear probes for detecting prompts leading to dangerous behavior. The alignment team from Anthropic is currently working on a research agenda called “sleeper agents” where they deliberately train deceptively aligned models ([Hubinger et al., 2024](https://arxiv.org/abs/2401.05566)) to test whether currently available techniques can detect misalignment. These "sleeper agents" are models with hidden backdoors introduced during training. One of the sleeper agents they trained writes secure code when the prompt indicates year “2023” but inserts vulnerabilities when the prompt indicates “2024”. Such dangerous outputs are hard to detect, and could easily be missed by a human overseer, this is why it would be extremely useful to develop an automatic detection method. Anthropic researchers have trained linear probes based on sleeper agents’ residual stream activations that classify inputs as safe or dangerous with very high accuracy ([MacDiarmid et al., 2024](https://www.anthropic.com/news/probes-catch-sleeper-agents)). Whether or not a prompt will trigger defection appears to be linearly encoded across a wide range of middle residual streams. However, they remain wary of this result and acknowledge that the surprisingly high accuracy of the probes may be due to the backdoor insertion, and that “natural defection” may not be detected as easily.

It was also suggested to train probes on human-written scenarios of takeover attempts or catastrophic actions ([Roger., 2023](https://www.alignmentforum.org/posts/WCj7WgFSLmyKaMwPR/coup-probes-catching-catastrophes-with-probes-trained-off)) to detect such goals or intentions in models before they happen. Similarly to sleeper agents, it is unclear whether probes trained in artificial settings will generalize in real-world scenarios.

**Limitations of probing classifiers** - **Correlation, not causation:** Probing classifiers indicate that a concept (or a proxy of that concept) is encoded, but they don’t reveal whether this concept is actively used by the network during inference. The classifier’s high accuracy may reflect the ease with which it can detect patterns, not necessarily that the model relies on those patterns for decision-making. To discover causal effects we need to intervene in representations of the model instead of just observing them.

- **Identifying proxies rather than “true concepts”:** Probing may detect patterns that act as proxies for the concept of interest, rather than the concept itself. For example, a probe trained to detect “legal language” might actually be detecting correlated cues (such as certain formal words or sentence structures) rather than a genuine understanding of legal terminology. This makes it challenging to interpret probes as definitive indicators of the exact concepts represented within the model.

</content>

</note-box>

## Superposition

To make sense of data, classify it, or make decisions, neural networks need to learn features—representations that capture meaningful patterns in the data. However, networks have a limited number of neurons to store a vast amount of information. Instead of assigning a single neuron to each feature, neural networks often "share" neurons across multiple features. This shared, overlapping storage is known as superposition.

**Superposition occurs because it allows the network to handle more features using fewer neurons, making it more memory-efficient.** However, this efficiency comes at a cost: polysemanticity. Polysemanticity means that a single neuron or component in the network represents multiple, often unrelated, features. For example, one neuron might activate in response to both "cats" and "cars," even though these concepts are entirely different.

**Polysemanticity and Superposition.** The vocabulary surrounding superposition and related concepts is often messy. The terms superposition and polysemanticity are often used interchangeably, even though they refer to slightly different aspects of the same phenomenon in some contexts: superposition describes the overlapping storage of features, while polysemanticity highlights the behavior of neurons that respond to multiple distinct features. Also keep in mind that superposition should not be confused with the superposition hypothesis, which is a specific theory proposed to explain why and how superposition occurs in neural networks.

**This overlap creates a challenge for interpretability.** Ideally, we might expect each neuron to have a clear and singular purpose—one neuron for "cats," another for "cars," and so on. In reality, many neurons respond to combinations of unrelated features, leading to entangled representations. This means that interpreting individual neurons in isolation often provides an incomplete or misleading picture ([Bolukbasi et al., 2021](https://arxiv.org/abs/2104.07143)).

Contrast this with a hypothetical network without polysemanticity: every neuron would correspond to a distinct feature, making the model much easier to interpret. However, such a design would require far more neurons to represent every feature individually, which is computationally inefficient, particularly in large-scale models. As a result, superposition is practically inevitable in modern neural networks.

From an AI safety perspective, understanding superposition is critical. If we want to trace how a model makes decisions, we need to identify and disentangle these overlapping features. Only then can we retrace the reasoning behind its predictions and uncover what drives its behavior.

Before diving into techniques for disentangling features, researchers first sought to understand how polysemanticity arises. Key questions include:

- What causes polysemanticity in neural networks?

- How does model architecture or the training process influence it?

- Can it be controlled or mitigated?

To answer these, researchers used toy models—simple, small-scale neural networks. Toy models allow for controlled experimentation and help researchers isolate and study phenomena like superposition without the complexity of larger systems. The following subsection details the toy models used to study polysemanticity.

<note-box>

<collapsed> True

<title> Experiments on Toy Models to Support the Superposition Hypothesis

<content>

The Toy Models of Superposition paper introduces simplified models that help researchers study superposition in a controlled environment ([Elhage et al., 2022](https://transformer-circuits.pub/2022/toy_model/index.html)). These models provide evidence supporting the superposition hypothesis—a theory about how neural networks efficiently store and organize information.

The superposition hypothesis suggests that neural networks can represent more features or concepts than they have individual neurons by encoding information as linear combinations across multiple neurons. This means:

1. **Efficient compression:** Neural networks can compress information by representing more features than there are available dimensions, optimizing memory use.

2. **Distributed representation:** Features are not exclusively tied to single neurons; instead, they are distributed across multiple neurons.

3. **Non-orthogonal directions:** Features are stored in directions that are not perfectly orthogonal in the network's activation space, which leads to overlaps and potential interference between concepts.

This paper is a cornerstone of mechanistic interpretability because it reveals fascinating phenomena about how neural networks organize and store information:

- **Demonstrating superposition:** The experiments show that superposition occurs and identify the conditions under which it arises.

- **Explaining mono- and polysemantic neurons:** The paper clarifies why some neurons specialize in a single feature (monosemantic) while others represent multiple features (polysemantic).

- **Phase transitions in training:** It highlights a phase change[^footnote_phase_transition] during training that determines whether features are stored in superposition.

- **Geometric feature organization:** Features in superposition are arranged into geometric structures such as digons, triangles, pentagons, and tetrahedrons, providing insight into the network’s internal organization.

[^footnote_phase_transition]: A phase change in neural network training refers to a sudden, qualitative shift in the behavior or structure of the model during the training process.

The following figure is a great illustration of superposition in a toy model. The toy model has 2 dimensions, represented by the x and y axis in the figure below, but it needs to learn 5 features. This means that the model needs to find a way to fit more information (5 features) into fewer dimensions (2-dimensional space). Each feature is given an importance, represented with colors. An important feature is a feature that has a significant impact on the model’s accuracy or loss function (if removing or weakening the representation of this feature causes a large drop in performance, it would be considered important). The key challenge in superposition is how to efficiently encode important features while minimizing overlap and interference between them.

Each feature also has a sparsity. This refers to how often it is active in the dataset. A dense feature (low sparsity) is activated frequently, making it harder for other features to coexist in the same dimensions without interference.

![Enter image alt description](Images/JNC_Image_17.png)

<figure-caption>

How does a 2-dimension model encode 5 features as their sparsity increases? 0% sparsity means that features are very dense, or frequent. The model only encodes the two most important features in orthogonal dimensions. As sparsity increases and the important features are less frequently useful, the toy model encodes additional features in non-orthogonal directions. The intuition is that the less frequent the features are, the less likely two overlapping features are to be activated at the same time and cause interference. So the cost of interference between features is outweighed by the advantage of learning more features. At 90% sparsity the 5 features are represented as a pentagon. From ([Elhage et al., 2022](https://transformer-circuits.pub/2022/toy_model/index.html)).

</figure-caption>

When encoding features, there is a tradeoff to make between the usefulness of having as many features as possible and low interference between them. Models embed their features into very complex geometric structures to reach optimal encoding. The figure below shows the different geometric structures that models use to encode features.

![Enter image alt description](Images/d6h_Image_18.png)

<figure-caption>

As features get sparser (less frequently activated), more of them can be encoded optimally and in more complex geometric structures. The first figure on the top left shows that when features are very dense, only the most important features are represented and they are organized in tetrahedrons. This model learns 28 features and encodes them in 7 tetrahedrons. On the second figure features are slightly sparser, more of them can be optimally encoded, and tetrahedrons are replaced by triangles and digons. This model learns 46 features encoded in triangles and digons. Superposition exhibits complex geometric structure. From ([Elhage et al., 2022](https://transformer-circuits.pub/2022/toy_model/index.html)).

</figure-caption>

</content>

</note-box>

## Sparse Autoencoders

**A major challenge in mechanistic interpretability is polysemanticity, where a single neuron or feature represents multiple, unrelated concepts.** Polysemanticity arises naturally in LLMs’ MLPs and residual streams, and makes it more complicated to identify which specific features influence a model’s outcome. Sparse AutoEncoders (SAES) are a promising approach for disentangling features within a network ([Bricken et al., 2023](https://transformer-circuits.pub/2023/monosemantic-features), [Gao et al., 2024](https://arxiv.org/abs/2406.04093), [Templeton et al., 2024](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html#related-work-steering)).

**SAEs are gaining popularity because they have shown promising results in separating out features.** Features extracted using SAEs can then be used to:

- Steer language models behavior away from undesirable outcomes (see section Activation Steering). ([Templeton et al., 2024](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html#related-work-steering)) found a bunch of safety-relevant features in Claude 3 Sonnet, including features for unsafe code, bias, sycophancy, deception and power seeking, and dangerous or criminal information. These features activate on text involving these topics and causally influence the model’s outputs when intervened upon.

- Find more interpretable circuits directly made of features instead of model components. In particular, finding and understanding the circuits in which safety-relevant features are involved could be valuable (see section on Automating and Scaling Interpretability).

SAEs are also great because they are trained in an unsupervised manner, which enables us to discover abstractions or associations formed by the model that we might not have anticipated beforehand.

**What is an autoencoder?** An autoencoder is a neural network designed to learn compressed representations of input data by encoding it into a lower-dimensional latent space and then reconstructing the original input from that representation. The latent space is the layer where the data is represented in a compressed or abstracted form, containing the key features necessary for reconstructing the input. This learned representation often captures the essential patterns or features in the data.

![Enter image alt description](Images/7wM_Image_19.png)

<figure-caption>

An autoencoder learns two transformations, represented by encoder weights and decoder weights, to compress input data into a lower-dimensional latent space and then reconstruct the original input from this representation.

</figure-caption>

**Why are SAEs “sparse”?** Autoencoders can vary in structure and purpose. SAEs are autoencoders that introduce sparsity constraints on the activations in the latent space, encouraging the model to use a limited number of latent neurons for each input. This “sparsity” forces the model to learn distinct and specific features, making the representations more interpretable.

**How do SAEs help disentangling features in transformers?** The process of disentangling model activations into interpretable features typically involves training a sparse autoencoder to reconstruct activations from specific parts of a model, such as the MLP of a particular layer or a residual stream, with a latent space larger than the input[^footnote_overcomplete_autoencoders], so that each neuron in the latent space will hopefully be monosemantic - representing a single feature - and interpretable.

[^footnote_overcomplete_autoencoders]: An autoencoder with a latent space larger than its input is called an overcomplete autoencoder.

![Enter image alt description](Images/ckD_Image_20.png)

<figure-caption>

Models activations can be decomposed into features using a sparse autoencoder. This figure illustrates an SAE trained to disentangle features in an MLP. From ([Bricken et al., 2023](https://transformer-circuits.pub/2023/monosemantic-features)).

</figure-caption>

**Dictionary learning.** After training a SAE, each neuron in its latent space can be analyzed to understand which specific inputs or features it responds to. By identifying these responses, researchers can effectively build a “dictionary” of features, where each neuron corresponds to a distinct feature in the data. This process of training SAEs on various layers and parts of a model to identify these features is known as dictionary learning.

For example, in a study on Claude 3 Sonnet, safety-relevant features such as those for “unsafe code” or “error tokens” were identified using SAEs. Interestingly, increasing the activation of the unsafe code feature in the SAE latent space and feeding back into the model the activations reconstructed by the SAE caused it to generate a buffer overflow vulnerability ([Templeton et al., 2024](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html#related-work-steering)).

![Enter image alt description](Images/5xS_Image_21.png)

<figure-caption>

Examples of safety-relevant features extracted from Claude 3 Sonnet, such as features for unsafe code and error tokens. The color scale indicates the degree to which each feature is activated for each token, with darker orange indicating higher activation. The “code error” feature activates strongly on tokens that contain an error. The images shown correspond to examples that strongly activate the specific feature. From ([Templeton et al., 2024](https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html)).

</figure-caption>

**Limitations and open research directions for SAEs.** Although promising, SAEs are still early work with limitations:

- **Incomplete understanding of model usage:** Identifying model features doesn’t reveal how they are used during inference, we still have to find the circuits involving them.

- **Difficulty in feature interpretation:** Not all features discovered by SAEs are easily interpretable; some features remain challenging to understand.

- **Lack of validation methods:** Currently, there are limited methods to test the validity of feature interpretations.

- **SAEs have poor reconstruction quality:** Sparse autoencoders don’t reconstruct model activations very well, which means that they don’t completely capture the behavior of our models. For instance, passing GPT-4’s activations through an SAE results in performance equivalent to a model trained with 10x less compute ([Gao et al., 2024](https://arxiv.org/abs/2406.04093)).

SAEs present intriguing research questions for AI safety and interpretability:

- What features activate during jailbreaks?

- What features need to activate or to remain inactive for a model to give advice on producing cyberattacks, bioweapons, etc. ?

- Can we use the feature basis to detect when fine-tuning a model increases the likelihood of undesirable behaviors?

# Interventional Methods

## Activation Patching

**Activation patching is a technique used to understand and pinpoint specific parts of a model responsible for certain behaviors or outputs.** For example, when you ask an LLM to complete the sentence: “When John and Mary went to the store, John gave a bottle to”, how does the model know it should answer “Mary” instead of “John” or some other name? This completion requires the model to track which person is the recipient of the action, meaning it has to understand and store contextual roles (i.e., who is giving and who is receiving).

Researchers have used activation patching to discover which parts of the model are responsible for this kind of role assignment. Specifically, the goal is to identify the circuit (i.e., the group of neurons and connections) that helps the model decide that “Mary” is the correct answer ([Wang et al., 2023](https://openreview.net/forum?id=NpsVSN6o4ul)).

<note-box>

<collapsed> True

<title> Detail - Activation Patching

<content>

To illustrate the activation patching process, consider the figure below ([Heimersheim & Nanda, 2024](https://arxiv.org/abs/2404.15255)). Let’s say we want to understand how a model completes the sentence "When John and Mary went to the store, John gave a bottle to" and which components are involved in choosing "Mary" as the answer. Activation patching generally requires three stages:

1. **Clean Input:** On the left, the model processes the sentence “John and Mary went to the store, John gave a bottle to” generating a series of activations (outputs from each layer) shown in green. This clean input provides the model with the correct context to interpret “John” as the giver and “Mary” as the recipient. The model predicts “Mary”.

2. **Corrupted Input:** On the right, the model is given a corrupted input: “Bob and Mary went to the store, John gave a bottle to” In this case, the activations (in red) will differ because the model is now processing “Bob” instead of “John”. Here, there is an ambiguity about whether “Mary” or “John” is the intended recipient, so the answer will not necessarily be “Mary”.

3. **Patching Process:** Activation patching involves taking specific activations from the clean input “John and Mary…” and substituting them into the corrupted input “Bob and Mary…”. This is indicated by the arrow. By patching activations from the clean input, we can test whether the model's understanding of "John" as the giver and "Mary" as the recipient can be restored, even when the corrupted input with "Bob" creates ambiguity. At this step, we observe how much the model prediction shifts towards “Mary”. For example, if patching the activations of a specific attention head increases the logit for “Mary”, it suggests that head is an important part of the circuit responsible for the task.

4. Iterating this procedure over different layers and components (such as attention heads or MLPs) allows researchers to identify the components most responsible for the target behavior.

![Enter image alt description](Images/hpl_Image_22.png)

<figure-caption>

An illustration of the activation patching process. On the left, the model processes a clean input sequence “John and Mary,” with activations shown in green. On the right, the model processes a corrupted input sequence “Bob and Mary,” with activations shown in red. Activation patching involves replacing one or more activations in the corrupted sequence with corresponding activations from the clean sequence (indicated by the arrow). The resulting patched activations are then passed forward to observe how they affect the model’s output logits. By analyzing whether the patched activations restore the desired output, researchers can identify which parts of the model’s activations are responsible for specific behaviors or outputs. From ([Zhang & Nanda, 2023](https://arxiv.org/abs/2309.16042)).

</figure-caption>

![Enter image alt description](Images/kdG_Image_23.png)

<figure-caption>

The red neurons and connections represent the most important components of GPT-2 small for completing the sentence “When John and Mary went to the store, John gave a bottle to _” (known as the Indirect Object Identification (IOI) task). From ([Conmy et al., 2023](https://arxiv.org/abs/2304.14997)).

</figure-caption>

Activation patching was used to find circuits for various tasks ([Wang et al., 2023](https://openreview.net/forum?id=NpsVSN6o4ul)) in LLMs, including:

**Example Prompt:** “When John and Mary went to the store, John gave a bottle to”

**Completion:** “Mary”

**Task:** Indirect Object Identification (IOI) ([Wang et al., 2023](https://openreview.net/forum?id=NpsVSN6o4ul))

**Example Prompt:** “The war lasted from 1517 to 15”

**Completion:** any two digit number greater than 17

**Task:** Greater-Than ([Hanna et al., 2023](https://arxiv.org/abs/2305.00586))

![Enter image alt description](Images/Og6_Image_24.png)

<figure-caption>

Example Prompt: “The war lasted from 1517 to 15” , Completion: “ files” , Task: Docstring ([Heimersheim & Janiak, 2023](https://www.alignmentforum.org/posts/u6KXXmKFbXfWzoAXn/a-circuit-for-python-docstrings-in-a-4-layer-attention-only)). The model predicts the next token, which should be a copy of the next argument in the definition.

</figure-caption>

There exists numerous activation patching settings, as detailed in ([Zhang & Nanda, 2023](https://arxiv.org/abs/2309.16042)). Activation patching can be applied at different levels of granularity, ranging from patching the entire residual stream at a particular layer to patching specific token positions within the model.

</content>

</note-box>

**Activation patching doesn’t explain the model in a fully causal way:** it helps identify which components are involved in certain behaviors, but it doesn’t always clarify how those components interact or contribute causally to the overall behavior. Knowing that a particular neuron or attention head is involved doesn’t necessarily mean we understand its specific role in the model’s decision-making process. The method is context-dependent, meaning components critical for one task may not generalize to others. Also, there is a trade-off in granularity: finer patches capture more detail but may miss broader interactions, while coarser patches risk overlooking important elements. Moreover, as models grow in size, both the complexity and computational cost of using activation patching increase, making it harder to isolate meaningful circuits.

## Activation Steering

Activation steering is a technique used to control a model’s behavior by modifying its activations during inference. Unlike traditional methods like fine-tuning, or RLHF, activation steering allows for direct intervention without the need to retrain the model.

Here is an example where activation steering was used to enforce GPT-2 into talking about love-related topics, regardless of the previous context ([Turner et al., 2023](https://arxiv.org/abs/2308.10248)):

- **GPT-2 default completion:** I hate you because… -> you are the most disgusting thing I have ever seen.

- **GPT-2 steered in the “love” direction:** I hate you because… -> you are so beautiful and I want to be with you forever.

Activation steering can be used to address remaining issues after safety training and fine-tuning by:

- **Steering models towards desirable outcomes:** Improving truthfulness ([Li et al., 2023](https://arxiv.org/abs/2306.03341)), honesty ([Zou et al., 2023](https://arxiv.org/abs/2310.01405)), avoiding generating toxic or harmful content, customizing chatbot personalities (e.g., making them more formal or friendly), or steering in the style of specific authors without retraining the model.

- **Post-deployment control:** Monitoring AI systems for dangerous behaviors and enhancing robustness to jailbreaks by steering models to refuse harmful requests ([Zou et al., 2023](https://arxiv.org/abs/2310.01405)). It may also be possible to strengthen other safety techniques, like Constitutional AI, by examining how they encourage the model toward safer and more honest behavior, as well as by identifying any gaps in this process ([Anthropic, 2024](https://www.anthropic.com/news/mapping-mind-language-model)).

<video>

[https://www.youtube.com/watch?v=CJIbCV92d88](null)

</video>

<video-caption>

A second example of steering on Claude 3 Sonnet using sparse autoencoder features. Dictionary learning on Claude 3 Sonnet

</video-caption>

Note that the Representation Engineering agenda ([Zou et al., 2023](https://arxiv.org/abs/2310.01405)) is a variant of activation steering that proposes to steer LLMs toward desirable outcomes such as more honesty, less bias, etc.

<note-box>

<collapsed> True

<title> Details - Activation Steering

<content>

Activation steering involves two main steps. Let’s say we want to make our model more honest, this involves two main steps:

**Identify the honesty direction in the model's activation space.** This is typically done by collecting model activations for prompts designed to elicit contrasting behaviors (e.g., "honest" vs. "dishonest" responses) and analyzing these to find a linear direction that separates the two. The model's activations can be thought of as vectors in a high-dimensional space. Certain directions in this space correspond to specific behaviors. For example, one direction might correlate with generating more positive text, while another could steer the model to talk about science. This direction, sometimes called a concept vector, represents the targeted attribute in activation space.

![Enter image alt description](Images/jGl_Image_25.png)

<figure-caption>

Identifying an activation steering direction. From ([Wehner, 2024](https://www.alignmentforum.org/posts/3ghj8EuKzwD3MQR5G/an-introduction-to-representation-engineering-an-activation)).

</figure-caption>

**The second step is steering the model’s behavior by adding this concept vector to the model's activations at inference time.** By introducing this vector at a relevant layer, we can amplify or suppress certain behaviors without retraining the model. For instance, adding the "honesty" vector to a model’s activations during inference nudges it toward generating more honest responses.

![Enter image alt description](Images/KCw_Image_26.png)

<figure-caption>

The concept vector is added to the activations at a specific layer to influence the model’s behavior in the desired direction. From ([Wehner, 2024](https://www.alignmentforum.org/posts/3ghj8EuKzwD3MQR5G/an-introduction-to-representation-engineering-an-activation)).

</figure-caption>

The concept vector can also be obtained using a linear probe (see section on Probing Classifiers), or can be a feature found through dictionary learning (see section on Sparse Autoencoders) as shown on the Claude 3 Sonnet video above.

</content>

</note-box>

# Automating and Scaling Interpretability

State-of-the-art models now contain hundreds of billions of parameters and thousands of interconnected layers, making manual inspection of model components infeasible. Mechanistic interpretability aims to analyze how individual elements—like attention heads, neurons, features, or entire layers—interact to produce specific behaviors. However, as models scale, manual approaches like activation pathing for circuit discovery, subgraph study, and subsequent explanation generation ([Wang et al., 2023](https://openreview.net/forum?id=NpsVSN6o4ul)), become infeasible to use. This is why developing mechanistic interpretability methods that can scale is essential.

Research in scalable interpretability, such as Automated Circuit DisCovery (ACDC) attempts to introduce algorithms that automate the process of finding circuits within a transformer.

## Automatic Circuit DisCovery (ACDC)

In the Activation Patching section we introduced how interpretability researchers manually discover circuits. Automatic Circuit DisCovery (ACDC) is an algorithm that automates the circuit discovery process and conducts all the activation patching experiments required to identify a circuit.

The typical manual circuit discovery workflow can be broken down into three main steps:

1. Selecting a behavior, a dataset that elicits this behavior, and a metric to measure the model's performance on the behavior,

2. Dividing the model into a computational graph: the model is represented as a graph, where nodes correspond to individual components like attention heads or MLPs, or more granular units like individual neurons, depending on the granularity of the analysis,

3. Isolating the relevant circuit: this step is what the ACDC algorithm automates. It involves identifying which components (nodes and edges) in the computational graph are involved in the behavior under study.

<note-box>

<collapsed> True

<title> The ACDC algorithm

<content>

The ACDC algorithm is a recursive algorithm that isolates circuits by iterating over the computational graph from outputs to inputs and pruning unnecessary edges. The high-level steps are:

1. Start with the entire computational graph of the model,

2. We will process the graph starting from the output layer, moving backward to the input,

3. For each node, try to remove as many edges that enter this node as possible, without reducing the model’s performance on a selected metric (we don’t want the removal to impact the model’s performance on the specified task too much). If the change is minimal (below a set threshold), keep the edge removed.

4. Iterate over all remaining nodes (from the output later to the input layer)

5. Finally return the simplified subgraph with only the connections needed for the task.

The ACDC algorithm can successfully rediscover circuits found in previous research, such as the IOI or Greater-Than circuits.

</content>

</note-box>

Recent advancements have introduced methods for automatically discovering sparse feature circuits ([Marks et al., 2024](https://arxiv.org/abs/2403.19647)) - circuits made of sparse autoencoder (SAE) features rather than model components. Unlike traditional circuits, which are made of challenging-to-interpret model components like neurons or MLPs, SAE circuits are built from sparse autoencoder (SAE) features, which are directly interpretable.

The authors of this research developed unsupervised techniques to automatically discover thousands of feature circuits, many of which correspond to previously unanticipated model behaviors. This approach opens up new possibilities for interpreting models by focusing on the high-level features that drive behaviors, rather than using more abstract and less interpretable models components.

# Critiques

While interpretability offers potential value in understanding complex machine learning models, it faces several critical limitations that restrict its practical impact. Below are the main challenges that restrict interpretability’s usefulness in ensuring AI safety:

- **Limited practical use:** Interpretability tools and techniques rarely provide actionable insights for real-world applications, especially in industry.

- **Issues with Enumerative Safety:** Enumerative safety—the idea of analyzing every feature within a model to detect dangerous elements—faces inherent issues. High-level behaviors, not individual features, often drive risk. Focusing on isolated “risky” neurons or components can miss the broader capabilities that are more likely to cause harm.

- **Improved capabilities:** Although interpretability is intended to enhance safety, it can also unintentionally improve model performance in ways that might increase risk. For example, better insights into a model’s behavior can sometimes make it more capable without necessarily making it safer.

- **Alternative approaches can be more effective:** In many cases, tasks that interpretability aims to address, such as detecting and preventing undesirable behavior, are better achieved through other strategies, like evaluations, red-teaming, or fine-tuning.
