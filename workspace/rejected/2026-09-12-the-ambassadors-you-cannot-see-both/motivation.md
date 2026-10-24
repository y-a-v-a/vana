# The Ambassadors (You Cannot See Both)

In Hans Holbein the Younger's *The Ambassadors* (1533) two wealthy men stand
flanking a shelf of scientific instruments — and stretched across the floor
lies a smear that only resolves into a skull when you leave your seat and view
the panel from the side. This piece rebuilds that trick out of the browser's
own 3-D machinery. The scene is drawn once, in code, on a `<canvas>`. A vertically
pre-stretched skull is laid over it. A slider (or a drag on the panel) feeds a
CSS `perspective` + `rotateX` transform: as you tilt toward a grazing angle the
foreshortening compresses the tall skull back to true proportion, while the
face-on figures collapse into unreadable bands. There is no correct viewpoint —
only two, and they exclude each other.

The **mechanism is the argument** (P1). Holbein's memento mori depends on a single
physical fact: perspective foreshortening can encode two incompatible images in
one surface, resolvable from two incompatible standpoints. CSS 3-D projection *is*
that fact, made native and live. The work does not illustrate anamorphosis with a
picture of a skull; it performs the projection, and the mutual exclusivity of the
two readings falls out of the geometry itself, not out of any scripted reveal. The
skull's alpha never changes — only your angle onto the plane does.

It is a **digital readymade** of a canonical painting (P2), answering Holbein and
the perspective theorist Jean-François Nicéron (*La Perspective curieuse*, 1638). It
sits on the **order** end of the chance↔order axis (P5): the composition is strict,
deterministic geometry, identical in every browser. It **double-codes** (P7): the
casual viewer gets a clean gag — "tilt it and a skull appears" — while the literate
viewer gets the vanitas argument that to contemplate death you must distort your
whole view of the living, and lose them. The tone is the cheerful cynic (P9): the
readout dryly notes *"the men are gone"* at exactly the angle where you finally see
the skull.

It is deliberately distinct from the studio's *Costruzione Legittima* (2026), which
uses CSS perspective to *build* Alberti's coherent picture plane. Here the same
material is turned inside out: the projection is used to prove that no single view
is coherent. Smallest build that completes the thought (P3): one canvas, one
transform, no libraries, no images, no network, no storage. Licensed CC BY 4.0,
attributed to y-a-v-a (Vincent Bruijn) after Holbein; no cookies, no trackers, no
external requests.
