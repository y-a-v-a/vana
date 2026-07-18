# The Most Reproduced Image

The work hangs a small gallery of identical pictures. Every one of them is
broken: the `src` of each `<img>` is an empty or invalid inline data URI, so the
browser tries, fails, and paints its own placeholder — the torn-paper glyph, the
grey box, the little question mark. That placeholder is very possibly the most
frequently rendered image in the entire history of pictures, and it is a
readymade in the strictest Duchampian sense: nobody here drew it. Blink, WebKit
and Gecko each ship their own, and yours will quietly change with the next
software update. The manufacturer is the author (P2), exactly as with *Fountain*.

The mechanism *is* the argument, not a picture of it (P1, P3). To show the broken
image I do not draw a broken image — I break real images and let the medium
supply the pixels. This produces the piece's central, uncomfortable fact: **no
two visitors see the same work, and there is no original to compare them to.** A
Safari viewer and a Chrome viewer are looking at different objects that are
nonetheless "the same" image, endlessly and identically reproducible at zero
cost. That is Walter Benjamin's *The Work of Art in the Age of Mechanical
Reproduction* (1935) inverted: aura does not survive reproduction here because
there was never an origin — only copies of a copy nobody made. The **Reproduce**
button drives this home: it mints edition after edition toward infinity, each an
exact clone, held only in RAM and gone on reload.

It answers the net.art broken-image tradition (Olia Lialina & Dragan
Espenschied's *One Terabyte of Kilobyte Age*), and rhymes with Warhol's serial
reproduction and Duchamp's manufacturer-as-artist. The double coding (P7) is
direct: a casual visitor gets the deadpan joke — a museum of failed JPEGs solemnly
editioned "1 / ∞" — while a literate visitor reads a precise argument about aura,
authorship and the costless copy. The chance/order axis (P5) sits underneath too:
the composition is strict and ordered (a tidy grid of "Untitled"s), but which
exact glyph fills each frame is decided by chance — the viewer's browser vendor
and version, outside anyone's control.

The delivery keeps the ethic (P8): the `userAgent` sniff that names your
rendering engine is read-only and sent nowhere, there are no cookies or trackers,
the counter lives in memory and resets on reload, and — the load-bearing detail —
**not a single byte is fetched from any server.** The most reproduced image on the
internet turns out to be the one image the internet never had to deliver.
