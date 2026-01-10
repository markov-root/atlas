import type { TextbookDefinition } from "."

export const AUTHORS = {
  markovg: { name: "Markov Grey", affiliation: "French Center for AI Safety (CeSIA)" },
  crsegerie: { name: "Charbel-Raphaël Segerie", affiliation: "French Center for AI Safety (CeSIA)" },
  su: { name: 'Su Cizem', affiliation: "French Center for AI Safety (CeSIA)" },
  martinet: { name: 'Charles Martinet', affiliation: "French Center for AI Safety (CeSIA)" }
}

export const TEXTBOOK_EDITIONS: TextbookDefinition[] = [
  {
    version: 'v1',
    language: 'en',
    chapters: [
      {
        docId: '1hWdq25Nw17538nk5aNG1_a8PxfNUhFKfaa9r0H6fRP4',
        tabId: 't.0',
        category: "I. Safety Fundamentals",
        authors: [AUTHORS.markovg, AUTHORS.crsegerie],
        acknowledgements: "Jeanne Salle, Charles Martinet, Vincent Corruble, Diego Dorn, Josh Thorsteinson, Jonathan Claybrough, Alejandro Acelas, Jamie Raldua Veuthey, Alexandre Variengien, Léo Dana, Angélina Gentaz, Nicolas Guillard, Leo Karoubi".split(", "),
        lecture: "https://www.youtube.com/watch?v=J_iMeH1hb9M",
        facilitationGuide: "https://docs.google.com/document/d/1L32xCVUCWEsm-x8UZ3GSTgKnmBcC7rJQLLIh9wGLj40/edit?usp=sharing"
      },
      {
        docId: '1TzouUrIM5SaJ0UJVXzk2SjDHPYaS7ue4tEy-9pHOVj4',
        tabId: 't.0',
        category: "I. Safety Fundamentals",
        authors: [AUTHORS.markovg, AUTHORS.crsegerie],
        acknowledgements: 'Jeanne Salle, Charles Martinet, Vincent Corruble, Sebastian Gil, Alejandro Acelas, Evander Hammer, Mo Munem, Mateo Rendon, Kieron Kretschmar, Camille Berger'.split(', '),
        paper: "https://arxiv.org/abs/2508.13700",
        lecture: "https://www.youtube.com/watch?v=dhr4u-w75aQ",
        facilitationGuide: "https://docs.google.com/document/d/1im_i6e9xEAe-koYlurYdn26n9h7pFX2HksnRfQmWxTQ/edit?usp=sharing"
      },
      {
        docId: '1vWbtZ4_nXwlGHWHPzvBYG5-__kNfkq5t3-b-pmDd1KI',
        tabId: 't.2iafmf6rj9gc',
        category: "I. Safety Fundamentals",
        authors: [AUTHORS.markovg, AUTHORS.crsegerie],
        acknowledgements: 'Alexandre Variengien, Jeanne Salle, Charles Martinet, Amaury Lorin, Alejandro Acelas, Evander Hammer, Jessica Wen, Angélina Gentaz, Jonathan Claybrough, Camille Berger, Josh Thorsteinson, Pauliina Laine'.split(', '),
        lecture: 'https://www.youtube.com/watch?v=iO7Jl4xders',
        facilitationGuide: 'https://docs.google.com/document/d/1cv0gzwSouDjckYHzV7gYbHPKhJZR6bwbJWgHzEJ604Q/edit?usp=sharing'
      },
      {
        docId: '16Dk4IRy1NoMSB5K_dKqR8XnwJ2PjX1LofoPGX_35o0k',
        tabId: 't.0',
        category: "I. Safety Fundamentals",
        authors: [AUTHORS.martinet, AUTHORS.crsegerie, AUTHORS.su],
        acknowledgements: "Charbel-Raphael Segerie, Léo Karoubi, Ines Belhadj".split(', '),
        facilitationGuide: "https://docs.google.com/document/d/1tp5rpzw_gekjju-UBp8tkbbnQOuA2QzsPF_um8Z4IOU/edit?tab=t.0#heading=h.fo57hwsn3del",
        lecture: "https://www.youtube.com/watch?v=FSKuDqze9es"
      },
      {
        docId: '165SypJtK-9S3Plot19EViZhjeRptivJELuWvUglQXa0',
        tabId: 't.0',
        category: "II. Technical approaches",
        authors: [AUTHORS.markovg, AUTHORS.crsegerie],
        acknowledgements: 'Maxime Riché, Martin, Fabien Roger, Jeanne Salle, Camille Berger, Leo Karoubi'.split(', '),
        paper: "https://arxiv.org/abs/2505.05541",
        facilitationGuide: "https://docs.google.com/document/d/1T-UU0FBeElX6cvbWYKpVAl3U4ivrQLHA3IdIWqWKuBA/edit?tab=t.0#heading=h.fo57hwsn3del"
      },
      {
        docId: '1xek7xTWiNI4UWQOPmHBeMgmuRkCx6Yamd-a_5tzrxKg',
        tabId: 't.0',
        category: "II. Technical approaches",
        authors: [AUTHORS.markovg, AUTHORS.crsegerie],
        acknowledgements: "Jeanne Salle, Oscar Heitmann, Ram Rachum, Nicolas Guillard, Camille Berger".split(', '),
        facilitationGuide: "https://docs.google.com/document/d/1JfmzGii5QG6hW8AM5WxzDBVyGc14aLV_Lc_1PkK2ZLc/edit?usp=sharing"
      },
      {
        docId: '11YpIAKCHaB0yxYVBEkGEdmaC2haxlNRB2ua-dQflO8Y',
        tabId: 't.0',
        category: "II. Technical approaches",
        authors: [AUTHORS.markovg],
        acknowledgements: "Charbel-Raphael Segerie, Emanuele Ascani, Jeanne Salle, Oscar Heitmann, Camille Berger, Josh Thorsteinson, Nicolas Guillard".split(', '),
        facilitationGuide: 'https://docs.google.com/document/d/1im_i6e9xEAe-koYlurYdn26n9h7pFX2HksnRfQmWxTQ/edit?tab=t.maf91lgt511f#heading=h.mkm52f849qxn'
      },
      {
        docId: '1Z5YL7x65G06oy-cUT-h_kTFYlAB7wF4xooXijATbIf0',
        tabId: 't.0',
        category: "II. Technical approaches",
        authors: [AUTHORS.markovg, AUTHORS.crsegerie],
        acknowledgements: "Jeanne Salle, Chris Gerrby, Sebastian Gil, Josh Thorsteinson, Nicolas Guillard, Mateusz Bagiński, Yoann Poupart, Clément Dumas, Amaury Lorin, Mateo Rendon, Lucas Eichorn, Bogdan Ionut Cirstea, Gurvan R.".split(', '),
        facilitationGuide: 'https://docs.google.com/document/d/1DaygDSW0L5dWuJnpSjYPF2XUbW51UoBJsT1cjLYKc2w/edit?usp=sharing'
      }
    ]
  }
]
