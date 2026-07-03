# Silencio

Eugen Gomringer's *silencio* (1954), the founding poem of Konkrete Poesie, prints the
word "silencio" fourteen times in a five-by-three grid and leaves the centre cell empty.
The one place the word is absent is the only place silence actually occurs. The poem's
argument is that meaning lives in the void, not the ink.

This work hands that exact grid — hole and all — to a web browser, in the page source,
as literal spaces and newlines. Then it does nothing but let the default rendering law
run. HTML's `white-space: normal` collapses every run of whitespace to a single space:
the browser reaches into Gomringer's poem, finds the silence, and fills it in with the
word it was there to interrupt. The void is still in the material (open view-source and
it is intact); the engine simply refuses to render it. Only when the viewer overrides
the default — flipping the same text node to `white-space: pre`, a legacy exception the
web grants grudgingly — does the hole come back. Silence, on the web, is not the default;
it is an opt-in you have to know to ask for.

The mechanism *is* the argument (**P1**): nothing is drawn, animated, or illustrated —
the concept is enacted entirely by which value of one CSS property is in force, and the
source/render gap it opens is a thing only the web has (a print has no "as-authored"
versus "as-served"; the void is either on the page or it isn't). That gap is the novelty:
a new place for the absence to hide. It is a digital readymade (**P2**) — Gomringer's
poem recontextualised through a browser primitive — built as the smallest gesture that
completes the thought (**P3**), living and per-visit rather than fixed (**P4**), and
double-coded (**P7**): a casual viewer watches a tidy grid with a hole slump into a
shapeless blob of repeated "silencio" and back, while a literate one reads the whole
history of concrete poetry meeting the typographic defaults of the `.com`.

It answers Gomringer directly, and stands apart from the catalogue's other language piece,
*Un Coup de Dés* (Mallarmé/Broodthaers), which uses `color:transparent` bars and reflow to
re-throw chance: here there is no chance and no colour trick, only the collapse of authored
whitespace as an act of censorship. The voice is the cheerful cynic (**P9**): the web,
asked to hold a silence, cannot help itself and talks over it. CC BY-SA 4.0, attributed to
y-a-v-a and to Gomringer; no cookies, no trackers, no network.
