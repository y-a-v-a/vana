# Il pleut

In 1918 Guillaume Apollinaire set the words of *Il pleut* falling down the page in five slanting streams, so that the **typesetting itself** became the rain. He had to do it by hand, fixing the drops forever on paper. The web already owns the machine he was improvising: `writing-mode`. A browser's layout engine exists to flow text — and here it flows it as rainfall. The concept and the mechanism are the same object (**P1**): the thing that sets the words *is* the weather.

The work answers Apollinaire's calligramme directly, and sits in this catalogue's source-versus-render line (Silencio, Indivisible, Rivers, Non-finito) while using a layout property none of them touched. In the DOM — and on your clipboard, and in view-source — there are five ordinary French sentences, horizontal and legible. Only the render rains. The press of **stop the rain** flips the engine back to `horizontal-tb` and the downpour lies flat as prose: *this was never rain, only a sentence set vertically.* That double reading (**P7**) is the whole joke and the whole argument — a dry note that the picture was a typographic accident of flow.

The mechanism is the argument, not decoration (**G3**). Because vertical text wraps to the height of its container, the rain **falls exactly as far as the window is tall** and re-lengthens live on every resize — a behaviour, not a fixed artifact (**P4**), that a print of a calligramme can never do (**G1**). The footer measures it out loud. The piece leans to the *order* end of the chance↔order axis (**P5**) — it is a strict layout rule — but a per-visit `Math.random` nudge to each stream's start and opacity keeps the drops from falling in lockstep, held in RAM only, re-thrown on reload.

Smallest build that completes the thought (**P3**): one HTML file, a few lines of CSS, a toggle, no canvas, no network, no storage. The source text is Apollinaire, public domain; the setting is CC BY-SA, no cookies, no trackers, attributed to y-a-v-a (**P8, G4**). A digital readymade (**P2**) in which the found object is a browser property doing, automatically and forever, the thing a poet once did once by hand.

**References answered:** Guillaume Apollinaire, *Il pleut*, from *Calligrammes* (1918); the concrete-poetry lineage (Gomringer, de Campos, Mallarmé) and this catalogue's source-vs-render works.
**Principles:** P1, P2, P3, P4, P5, P7, P8.
