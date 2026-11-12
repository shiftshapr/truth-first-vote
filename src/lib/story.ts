/**
 * The Truth First story: eight short chapters, one screen each. A line starting with "!" is a key line
 * and is set in the accent color. Every chapter has its own anchor (/story#the-layer) so it can be shared alone.
 * Factual claims need a source, like the rest of the site; this draft makes none, only commitments.
 */
export type Chapter = { id: string; title: string; stanzas: string[][] };

export const STORY: Chapter[] = [
  {
    id: 'the-swing',
    title: 'The Swing',
    stanzas: [
      ['Every few years, the country swings.', 'One side wins. The other side waits.', 'Then it swings back.'],
      [
        "Each time, we're told this is the election that fixes it.",
        'Each time, the same things stay broken:',
        'who gets heard, who gets watched,',
        'who pays, and who gets paid.',
      ],
      [
        'Most of us can feel it.',
        "You don't have to agree on the details",
        'to know that swinging harder',
        "won't take us somewhere new.",
      ],
    ],
  },
  {
    id: 'the-turn',
    title: 'The Turn',
    stanzas: [
      ["There's another way to move.", 'Not left. Not right.', '!Toward the truth.'],
      [
        'Not the truth as one side owns it.',
        'The truth as it is:',
        'with its sources shown,',
        'and whoever disputes it named out loud.',
      ],
      [
        "It sounds simple. It isn't.",
        "It means saying what's true when it costs your side,",
        "and admitting what's true when it helps the other one.",
      ],
      ['!Now is the moment to turn toward the truth.'],
    ],
  },
  {
    id: 'the-layer',
    title: 'The Layer',
    stanzas: [
      ["You don't have to leave anything.", 'Stay a Democrat. Stay a Republican.', 'Stay independent, or whatever you are.'],
      ["Truth First isn't a team you switch to.", "It's a layer you add:", 'a promise on top of the one you already have.'],
      ['When the truth and your side disagree,', '!you choose the truth.'],
      [
        'A Democrat and a Republican can both make that promise.',
        'Together, inside both parties,',
        'we become the vote neither side can take for granted.',
      ],
    ],
  },
  {
    id: 'the-countries',
    title: 'The Countries',
    stanzas: [
      ["Truth First isn't only American.", 'Any country can stand this way.'],
      [
        'Every Truth Country puts its own country first:',
        'its own people, its own land, its own future.',
        '!And it values every other people.',
      ],
      ['Those two belong together.', 'A country that tells itself the truth', "doesn't need to lie about its neighbors."],
      [
        'America is the first Truth Country,',
        'in a confederation of interdependence:',
        'each one free, each one first at home,',
        'and all of them counting on the others to be honest.',
      ],
    ],
  },
  {
    id: 'the-machines',
    title: 'The Machines',
    stanzas: [
      ['A new kind of power has arrived.', 'AI can read everything, remember everything,', 'and answer anyone.'],
      [
        'It could become the most powerful tool',
        'for surveillance and control ever built.',
        '!Or it could help us build a society that is safer, fairer',
        '!and more protective of each person.',
      ],
      ['Which one we get is a choice,', "and it's being made now."],
      [
        'So Truth First speaks with human and AI voices.',
        'Both are held to the same rule:',
        'show your sources, name who disagrees,',
        "and never pretend to be what you're not.",
      ],
    ],
  },
  {
    id: 'the-commons',
    title: 'The Commons',
    stanzas: [
      ['Everything AI knows, it learned from us:', 'what we wrote, said, made and argued over.'],
      [
        'Truth First treats that shared knowledge,',
        'the universal context graph,',
        'as something elemental, like water or air.',
        'It belongs to the people who made it.',
      ],
      [
        '!So the companies that build on it should pay to use it,',
        '!and the money should go to the people who contributed.',
      ],
      [
        'And the web itself should have layers:',
        'a place on every page',
        'where people can add context, sources and disagreement,',
        "so the truth travels with the thing it's about.",
      ],
    ],
  },
  {
    id: 'the-game',
    title: 'The Game',
    stanzas: [
      ["A party this new can't be handed down.", 'It has to be built by the people in it.', "So we're starting it as a game."],
      [
        "You don't score for loyalty.",
        "You don't score for shouting.",
        '!You score for being good at truth:',
        'declaring it, bridging to people who vote differently,',
        "making the other side's best case,",
        'and showing your sources.',
      ],
      [
        'When 100 founding players have joined,',
        'we write the real rules together, on Canopi.',
        'Slowly. Deliberately.',
        'At the pace people can take it in.',
      ],
    ],
  },
  {
    id: 'the-declaration',
    title: 'The Declaration',
    stanzas: [
      [
        'Every movement starts the same way:',
        'one person saying it out loud,',
        "so the next person doesn't have to say it alone.",
      ],
      ["!I'm a Democrat. I'm also Truth First.", "!I'm a Republican. I'm also Truth First."],
      ['Say it where the people who know you will hear it.', 'Then come play.'],
    ],
  },
];
