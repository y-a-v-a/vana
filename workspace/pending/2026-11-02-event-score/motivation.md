# Event Score

A numbered score of seven terse instructions sits on the left. On the right, the same
instructions appear in the order they are actually *performed*. The two columns rarely
agree. The performer is not a person and not the artist: it is the browser's **event
loop**, which obeys one unbreakable law of precedence — synchronous code runs first,
then microtasks (Promises), then macrotasks (timers). Chance (`crypto.getRandomValues`)
casts each instruction into one of those three queues per visit; the loop then realises
them by its own grammar, never by the reading order you were shown. The artist authored
the instructions and nothing else — not the casting, not the sequence.

The whole work turns on a single pun. Fluxus called its instruction pieces **events**
(George Brecht's event scores, 1959– ; Brecht studied under John Cage); the web calls its
scheduler the **event loop**. This candidate puts the two "events" in the same room and
lets the web-native one perform the art-historical one. That collision is the concept, and
it is also the mechanism — which satisfies **P1 (concept *is* execution)**: the gap between
score and performance is not illustrated by the code, it is *produced* by the code's
scheduler. Nothing here is a picture of a known artwork, which is the correction to the
previous "too illustrative" rejection: there is no image to read, only a behaviour.

It is a **digital readymade (P2)** — the JavaScript event loop, appropriated verbatim as a
performer — and the **smallest build that completes the thought (P3)**: two columns, one
button, no canvas, no assets. It sits squarely on the **chance / order axis (P5)**: chance
decides the casting, a deterministic machine law decides the order, so the piece stages
exactly the tension Kenneth Martin drew by hand and y-a-v-a re-staged in *A Chance of
Order* (2021) — here the order is not the artist's but the runtime's. It is **live and
per-visit (P4)**: every arrival re-casts the score, and the occasional accident where all
seven land in one queue yields a faithful performance the page flags as "by chance, not by
authorship" — fidelity is possible but never *authored*.

It answers **George Brecht and the Fluxus event score**, and behind him **John Cage** and
the old distinction between a score and its realisation: the delegation of execution to a
performer whose priorities are not the composer's. The **double coding (P7)** is clean — a
casual viewer reads "I numbered these 1–7 and they keep coming out 3·1·5…, the machine
reorders me"; a literate viewer reads the microtask/macrotask precedence of the event loop
and the whole twentieth-century argument about authorship and instruction. The tone stays
the dry cheerful cynic (P9): the engine performs your score faithfully, just never in your
order, and the one time it obeys, it was only an accident.

**References:** George Brecht, event scores / Fluxus (1959– ); John Cage; the JavaScript
event loop (sync / microtask / macrotask precedence); y-a-v-a, *A Chance of Order* (2021).
**License:** CC BY-SA 4.0, attribution y-a-v-a. No cookies, trackers, network, or storage.
