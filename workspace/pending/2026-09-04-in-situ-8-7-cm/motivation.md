# In Situ (8.7 cm)

The whole of Daniel Buren's practice rests on a refusal: the 8.7 cm stripe — lifted
from the awning fabric of Parisian shopfronts — is an *outil visuel*, a neutral
"visual tool" with no composition and no meaning of its own. Whatever it comes to
mean is dictated entirely by the site it is installed in. A painting on a wall, a
banner across a courtyard, a decoration, a joke — Buren's stripes are all of these
and none, depending on where you hang them. This work stages that thesis with the
one web mechanism that shares its exact logic: the CSS `@container` query, an element
that reads the size of its *frame* rather than the viewport or its own content.

The striped element is copied byte-for-byte into three frames. Nothing about the
work differs between them — same fixed 8.7 cm bands (Buren's real measure, rendered
via CSS centimetre units), same colour, same white. Yet each frame issues a
different verdict: below ~17.4 cm the work concedes it is merely *a line*; past two
bands it becomes *an awning* (Buren's own origin); past four, *a painting*. The
reclassification is not decorated onto the piece — it **is** the piece. The browser's
layout engine performs the institutional act of naming, and it names from context
alone. Drag any frame's native `resize` handle and watch the identical stripes cross
from line to awning to painting in real time: you are moving the wall, not the work.

This enacts **P1** (concept *is* execution — the container query literally computes
site-specificity), **P2** (the awning stripe is a readymade, recontextualised through
web-native layout), **P3** (smallest build: zero JavaScript, one repeating gradient,
two media queries), **P4** (live — the classification regenerates on every resize),
**P5** on the *order* pole (a strict rule set: fixed period, threshold-driven category),
and **P7** (a clean visual gag for anyone, a precise argument about the frame for the
literate). It answers Daniel Buren directly, and glances back at y-a-v-a's own
*But is it art?* (2025) — where that page said an unconditional **YES**, this one
replies *depends where you hang it*, and hands the deciding to the browser.

The mechanism is the argument because Buren's claim was never metaphorical: the site
really does constitute the work. A container query is the first web primitive to make
an element's identity a pure function of its enclosure. Same stripes, different frame,
different art — adjudicated by the layout engine, offline, under CC BY-SA, with no
cookie, no tracker, and no request of any kind.
