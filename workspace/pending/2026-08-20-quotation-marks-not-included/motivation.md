# Quotation (Marks Not Included)

A plain declarative sentence sits in a frame. Around one clause the browser prints
quotation marks — and around a clause nested inside it, the *secondary* marks —
in the punctuation of whatever nation you tell it to read in: curly `"…"` for
English, low `„…"` for German, guillemets `« … »` for French, corner brackets
`「…」` for Japanese. Those marks are the only thing that turns an ordinary line
into *a quotation* — into something quoted, framed, someone-else's. And they are
nowhere in the page. They are generated content, emitted live by the CSS `quotes`
property via `open-quote` / `close-quote`, sitting outside the DOM text entirely.
The readout proves it: **marks in the source: 0**. Select the sentence and copy it
and the marks fall off in your hand; you carry away flat, unquoted, unauthored text.

The mechanism *is* the argument (**P1**). Appropriation art is the gesture of putting
quotation marks around another's work — Sherrie Levine re-photographing Walker Evans,
Duchamp designating a urinal — so that the act of framing, not the object, is the art.
Here the frame is literally quotation marks, and the machine supplies them for free,
per locale, uncopyable. To quote is to appropriate; the browser does the appropriating,
and the thing it appropriates is a sentence describing its own appropriation. This is
the **digital readymade** (**P2**): the `quotes` property and `<q>` element are found
web plumbing, recontextualised so their literal operation enacts the concept. It is the
smallest build that completes the thought (**P3**) — one sentence, one CSS property, a
locale switch — and it double-codes (**P7**): a casual viewer reads a tidy self-referential
gag about who really did the quoting; a literate viewer reads Barthes' "tissue of
quotations", the death of the author folded into `::before` and `::after`.

It answers Sherrie Levine's *After Walker Evans* (1981), Duchamp's readymade, and
Roland Barthes' *The Death of the Author* (1967) — and it sits on the **infrathin**
edge y-a-v-a keeps returning to: the render says one thing, the source another, and
the difference between them is exactly the width of two glyphs the machine will not let
you keep. It extends the source-vs-render family (*Silencio*, *La Disparition*,
*Scrittura Speculare*) with an untapped mechanism — CSS generated quotation marks — and
a distinct argument about appropriation rather than concrete poetry or mirror-writing.

Delivery honours the ethic (**P8**): a single self-contained page, no fonts, no network,
no cookies, no storage; JavaScript only swaps the reading locale and never touches a
single mark. CC BY-SA 4.0, attributed to y-a-v-a and to the artists it quotes.
