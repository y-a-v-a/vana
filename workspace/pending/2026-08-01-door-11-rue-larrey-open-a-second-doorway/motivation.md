# Door, 11 rue Larrey (Open a Second Doorway)

In 1927 Marcel Duchamp had a carpenter hinge a single door in the corner of his
Paris apartment so that closing the bedroom opened the bathroom, and vice versa.
The readymade object was the French proverb Alfred de Musset had turned into a
play title — *a door must be either open or shut* — and Duchamp's answer was a
door that is always, structurally, both. This work moves that hinge onto the web.

The mechanism is a **BroadcastChannel** (P1, P8): the two doorways are two browser
frames of the same file, and the single door is one shared state passed between
them locally — same origin only, no server, no cookies, nothing stored. Focusing a
frame *claims* the door: it swings shut in the frame you are looking at, which by
the same swing leaves the other frame standing open. You cannot make both shut and
you cannot make both open, for the identical reason Duchamp's guests couldn't — it
is one door serving two openings. The shared channel is not a metaphor for the
single door; over the wire it *is* the single door (P1, P2). This is the digital
readymade: appropriate a known object and recontextualise it through web-native
logic (P2).

The work sits squarely on the **order** side of the chance/order axis (P5) — a
strict XOR rule, no entropy but the per-visit paint hue — while answering a piece
firmly in the conceptual lineage (P7): a casual viewer gets the swinging-door gag
in one frame; a literate viewer reads the 1927 corner, the Musset proverb, and the
whole "but is a state either/or?" argument that runs from Duchamp to Boolean logic.
It also answers the web's own dogma that a page is either loaded or not, open tab
or closed — here it is provably both, depending on which doorway you stand in.

The delivery is the argument's ethics too (P8): BroadcastChannel makes the
multiplicity *local*. Two windows on your own machine whisper to each other with no
network, so the editioned, reproduced work (P10-adjacent, Benjaminian) never leaves
the room — the aura is intact precisely because nothing is transmitted. Smallest
build that completes the thought (P3): one file, one channel, one door.

**References answered:** Marcel Duchamp, *Door: 11 rue Larrey* (1927); Alfred de
Musset, *Il faut qu'une porte soit ouverte ou fermée* (1845). **Principles:** P1,
P2, P3, P5, P7, P8.
