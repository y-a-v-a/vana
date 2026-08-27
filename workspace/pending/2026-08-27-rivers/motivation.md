# Rivers

A single column of prose set `text-align: justify`. To make the right margin
flush, the browser's line-breaking engine silently distributes extra space
between words — never touching the glyphs, only the gaps. Those inserted widths
exist nowhere in the DOM and vanish on copy (select the text and you get plain
single spaces back). Their by-product is the *river*: the pale vertical channel
of paper-colour that snakes down through a justified block, which typographers
are trained to see and eliminate. I set `hyphens: none` so the engine has no
choice but to stretch the spaces wider — the refusal of hyphenation is what
makes the rivers run deep. A measure slider and a justify/ragged toggle let the
viewer re-throw the rivers live and watch the ragged mode dissolve them
entirely, because ragged text asks the engine for no invisible labour at all.

**Mechanism *is* the argument (P1, G3).** The even block is not decorated with a
concept; the even block *is* the concept. The squared margins are an
achievement bought with unseen, ever-shifting whitespace, and the rivers are the
receipt. Nothing in the script draws or hides anything — the layout engine
computes the justification, and re-computes it on every width change, so the
work is a behaviour, not an image (P4). It reads at two depths (P7): a casual
viewer sees a book-like column and, prompted, notices the pale channels drift; a
literate viewer reads a note on invisible labour, mechanical reproduction, and
the death of the compositor's hand.

**Chance and order (P5).** The flush rectangle is pure order — the Gutenberg
ideal of the perfect textblock. The rivers are pure chance — accidents of where
the words happened to fall at this exact measure, unrepeatable at the next pixel
of width. The two are the same event seen from two sides, which is the axis the
whole practice sits on.

**What it answers.** It answers **Johannes Gutenberg's 42-line Bible** (c. 1455)
and its hand-squared margins — the first great feat of mechanical reproduction,
the deep root under **Walter Benjamin** (1935): the browser now performs, for
free and anonymously, the labour a compositor once did by eye. The term "river"
is **Robert Bringhurst's** (*The Elements of Typographic Style*). It extends the
net-native source-vs-render vein of my own **Silencio** (whitespace collapsed),
**Non-finito** (the ellipsis that lives only in the render) and **Indivisible**
(`hyphens: auto` inserting render-only break-marks) — but the mechanism here is
distinct: not collapse, not truncation, not hyphens, but the *insertion of
variable space to force a rectangle*, and the chance defect that insertion
leaves behind.

**Ethics (P8).** Self-contained, client-side only, CC BY-SA 4.0, attributed. No
cookies, no trackers, no PII, no web fonts, no network of any kind — the paper
stack is a system serif, and the rivers are literally the background showing
through.
