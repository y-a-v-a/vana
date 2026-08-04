# Equivalent

Alfred Stieglitz's *Equivalents* (1925–1934) are photographs of clouds offered as
pure abstraction: the sky severed from the ground, a shape of feeling with no
subject to name. Each was a unique gelatin-silver print of an instant of weather
that would never recur. This work re-stages that gesture with the one cloud
generator every browser already ships: the `feTurbulence` SVG filter primitive.
The full-bleed "photograph" you see is not an image file — it is fractal noise
synthesised live by the browser's filter engine, desaturated and pushed to a
high-contrast Stieglitz sky, all in a handful of declared SVG attributes. There is
no photograph anywhere, only a function being evaluated.

The mechanism *is* the argument (**P1**). `feTurbulence` is driven by a
pseudo-random generator that the SVG filter specification defines exactly, down to
its seed arithmetic. So the cloud — the oldest emblem of the ephemeral, the
unrepeatable, the once-only — is here a **deterministic value**: seed 0 is the
same sky for you, for me, for every visitor on every conforming browser, and it
will be the same sky forever. The page opens at seed 0 on purpose. Stieglitz's
"equivalent" was a subjective, singular exposure; the browser's equivalent is a
shared integer. Reproduction (**Walter Benjamin**, *The Work of Art in the Age of
Mechanical Reproduction*, 1935) is not applied *to* the aura here — it is baked
into the pigment.

This sits squarely on the chance↔order axis (**P5**): the surface reads as chance
(turbulent weather, atmospheric drama) while the substance is strict order (a
closed-form function of one integer). The browser's built-in noise is taken as a
found object and recontextualised (**P2**, the digital readymade) — nobody drew
these clouds; the W3C did, in prose. The build is the smallest that completes the
thought (**P3**): one filter, one rect, a dozen lines of JS whose only job is to
change a number. The label carries the depth, but the surface gag lands without
it (**P7**) — a casual viewer gets a moody sky portfolio they can flip through;
a literate one gets Stieglitz inverted into a spec.

It answers a specific web-native lineage as much as an art-historical one: it is
the deliberate mirror-image of the catalogue's *Arranged According to the Laws of
Chance* (crypto-random, held only in RAM, **physically irreproducible**). Here
chance is only skin; underneath, everything is reproducible — that inversion is
the whole point. The traversal (arrow keys, prev/next, or a typed seed) turns the
work into an infinite portfolio of *Equivalents*, every one of them pre-authored
by the filter spec and waiting at its number. Nothing is stored, nothing is sent,
no font or asset is fetched; the sky is regenerated in your browser each time you
name its seed. Licensed CC BY-SA 4.0, attributed to y-a-v-a after Alfred Stieglitz.
