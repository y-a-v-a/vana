# Aesthetic Measure (gzip)

In 1933 the mathematician George D. Birkhoff proposed that beauty could be written
as a fraction: **M = O / C**, aesthetic measure equals *order* divided by
*complexity*. A generation later Max Bense and Abraham Moles tried to rebuild the
same ambition on Claude Shannon's information theory — beauty as the residue left
after you subtract redundancy. This work takes them at their word and hands the
calculation to the one organ in the browser already trained to tell order from
noise: the **`deflate`/gzip compressor**. Each specimen's raw RGBA bytes are
pushed through `CompressionStream`. The bytes the encoder *removes* are its order
O (structure is what compresses); the bytes it *must keep* are its complexity C.
Divide, and the machine declares a winner.

The mechanism *is* the argument (**P1**). I am not illustrating information
aesthetics with a chart — the compressor is literally performing Birkhoff's
measurement, and its verdict is self-enacting: the flat grey Void compresses to
almost nothing, so its order approaches total and its M approaches infinity, while
pure crypto-random Chance compresses not at all and scores zero. The emptiest
canvas is, by the formula, the most beautiful. That is the cheerful-cynic punchline
(**P9**): run the dream of quantified beauty to its logical end and it crowns the
blank. Reinhardt, Malevich and Klein were right for the wrong reason.

The piece sits squarely on the chance↔order axis (**P5**): the five specimens are
arranged from maximum entropy (Chance, after Kenneth Martin's chance operations)
to maximum redundancy (the Void), and the compressed byte-count reads their exact
position on it — the same axis that runs through *A Chance of Order* and *Maleglitch*.
It is a digital readymade (**P2**): the readymade here is not an image but a codec,
the deflate algorithm that already ships in every browser to make the web smaller.
And it is double-coded (**P7**): the casual viewer gets a dumb game — *which picture
is the biggest file?* — while the literate viewer gets a precise, deadpan refutation
of Birkhoff, Bense and Moles.

It answers a specific lineage: Birkhoff's *Aesthetic Measure* (1933), Bense's
*Aesthetica* and Moles' *Information Theory and Esthetic Perception* (1958), all
resting on Shannon (1948). None of these could be tested on a page before
`CompressionStream` existed; the work could not be a print, because the print would
have to show you *its own compressed size*, which only exists while a machine is
compressing it (**G1**). Smallest build that completes the thought (**P3**): five
canvases, one encoder, one ratio, one crown. No network, no storage, no cookies;
CC BY-SA with full attribution (**P8**). The measurement is live — re-rolling the
chance specimen re-runs the whole appraisal, because there is no art piece, only
change.
