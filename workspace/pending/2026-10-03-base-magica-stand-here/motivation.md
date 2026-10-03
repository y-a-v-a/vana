# Base Magica (Stand Here)

A plinth stands in an empty gallery. It holds nothing, so the wall label reads
*Nothing. A base awaiting a body* and the verdict says **not art**. Hover the
base, tab to it, or tap it — stand on it — and the gallery changes its mind: a
spotlight blooms, a gilt edge appears, the base engraves itself *P. Manzoni,
opus 1961*, and the label now certifies a **Living Sculpture: you, for as long
as you remain**. Step off and the title lapses instantly. The base confers
nothing it does not *currently* hold.

**The mechanism is the argument (P1, P3).** The entire work is a single CSS
feature: `:has()`, the "parent selector." For twenty-five years CSS could style
a child by its parent but never a parent by its child — a container was
structurally blind to its own contents. `:has()` (interoperable across browsers
only since late 2023) finally lets the base *see what stands upon it* and become
a pedestal-of-art accordingly. The conferral of arthood by the container is not
illustrated by the code; it **is** the new selector's literal semantics.
`.gallery:has(.spot:hover)` says, in machine terms, exactly what Manzoni's base
said in 1961: *whatever stands here is a work of art.* There is no JavaScript —
no network, no cookies, no storage — only the cascade recognising an occupant.

**What it answers.** Piero Manzoni's *Base Magica — Scultura Vivente* (1961) was
a wooden plinth whose top bore two footprints; anyone who stood on it became, by
Manzoni's declaration, a living sculpture for the duration of their standing.
The piece distils Duchamp's readymade — art as an act of *nomination* rather
than making — and anticipates Brian O'Doherty's thesis (*Inside the White Cube*,
1976) that the frame confers the status. Here the browser's layout engine is the
nominating authority: containment is the signature (P2, readymade; P6, the
wall-label, the "incalculable, non-transferable" value, the red sold-dot).

**Chance ↔ order, and the live ontology (P4, P5, P7).** This sits firmly on the
*order* pole: a strict conditional — *contains an occupant → is art; empty → is
not* — with no randomness. Its novelty is ontological, not pictorial: arthood is
a transient property that exists only while the pointer, focus, or touch holds
it, and vanishes on exit; it could not survive as a print, where a base either
is or is not occupied forever. The surface gag lands for anyone (stand on the
box, become art; step off, stop) while the literate reading — `:has()` as the
container defined by its contents, the readymade as a parent selector — waits
underneath. A browser too old to support `:has()` is shown a note that its
blindness to its own contents is itself the point.

**References:** Piero Manzoni, *Base Magica — Scultura Vivente* (1961); Marcel
Duchamp, the readymade; Brian O'Doherty, *Inside the White Cube* (1976); the CSS
Selectors Level 4 `:has()` relational pseudo-class. Distinct from the
catalogue's *Socle du Monde (`<base>`)* (a different Manzoni work, driven by the
HTML `<base>` URL-resolution tag) and from *Inside the White Cube* (Fullscreen
API).
