# I Am Sitting in a Room (Re-encoded)

In 1969 Alvin Lucier recorded himself reading a short text, played the recording into
the room, recorded *that*, played it back, and repeated the loop dozens of times. With
each generation the room's resonant frequencies reinforced one another until his speech
dissolved entirely into a smooth, ringing tone — the architecture singing over the author.
The piece's text describes, in advance, its own destruction.

This work performs the same loop with the browser as both microphone and room. A square
panel holds Lucier's text, rewritten for pixels. Every frame the canvas exports itself as
a low-quality JPEG and draws the result back into itself, very slightly zoomed and turned.
JPEG compresses by projecting each 8×8 tile onto a fixed set of cosine basis functions —
the codec's *eigenmodes*, its standing waves. Re-encoding a re-encoding amplifies those
modes exactly as Lucier's room amplified its own. Within ~90 generations the words are
gone and only the blocks remain: the resonant frequencies the compressor was built to sing.

The mechanism **is** the argument (**P1**). I am not illustrating generational loss with a
picture of static; the live `toDataURL → Image → drawImage` feedback loop is the actual
recursive degradation, and the DCT block structure that emerges is the literal "resonance"
of the medium — there is nothing decorative between the concept and the code. It is a
**digital readymade** (**P2**): two found objects, Lucier's instruction-score and the JPEG
codec, recontextualised so the second completes the first. It sits squarely on the
chance/order axis (**P5**): the codec is pure deterministic *order*, yet iterated against
itself it produces emergent, unrepeatable-looking *resonance* — order curdling into noise.
It is a behaviour, not an artifact (**P4**): it must run; a screenshot of any single
generation is not the work, and it would die as a print.

It answers a named work — Lucier's **I Am Sitting in a Room (1969)** — and joins the
net-native lineage of *generational loss* (the meme of the file re-uploaded until it melts),
of which Lucier is the unwitting patron saint. It is the iterative sibling of the catalogue's
one-shot codec pieces (*Maleglitch*'s databending, *Abstract Painting (Backlit)*'s single
JPEG round-trip): here the loss is not a single cut but a slow erosion you watch happen.
The double coding (**P7**): a casual viewer gets a hypnotic dissolve and a deadpan caption
("No microphone was harmed. The room is the codec"); a literate one gets a precise claim
that the compression algorithm has resonant modes, that those modes are an aesthetic, and
that the author is the first thing they consume (**P9**).
