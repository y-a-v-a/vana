# Changes You Made May Not Be Saved

A page that wants to say goodbye to you, and is not allowed to. When you try to
leave — close the tab, hit back, navigate away — the artist hands the browser a
written farewell through the `beforeunload` event's `returnValue`. Since roughly
2016, every major browser ignores that string and substitutes one fixed, corporate
sentence of its own: *"Leave site? Changes you made may not be saved."* The work
shows both halves: the parting words that were meant, and the liability disclaimer
that will be spoken in their place. A different farewell is drawn at random on each
visit (P5, chance); the censorship that overwrites it is always identical (order).

The mechanism *is* the argument (P1, P3). The custom `beforeunload` string is a
web-native readymade (P2): a feature browsers deliberately neutered to stop scam
sites from manipulating people at the exit. That history is the material — not a
metaphor for suppression but a literal, dated, vendor-enforced suppression. The
script genuinely sets `e.returnValue = pick`; the platform genuinely discards it.
You can prove this by trying to leave. Concept and execution are the same object:
there is no farewell *depicted* anywhere, only a farewell *submitted and refused*.

It answers Bas Jan Ader's *I'm too sad to tell you* (1971) — the film of the artist
unable to speak his feeling — and it answers y-a-v-a's own 2012 web piece of the
same name. In 1971 the silence came from within: too sad to tell you. In 2026 the
silence is imposed from outside, by platform policy, in the name of protecting you.
Same muteness, two different jailers. That continuity places the work as a node in
the twenty-year argument (Narrative): the internet keeps re-staging the gestures of
20th-century art, and here it has quietly built a machine that performs the
artist's aphasia on his behalf.

The voice is the cheerful cynic (P9, P7): the surface gag is a heartfelt goodbye
flattened into *"Changes you made may not be saved"* — instantly legible and quietly
funny-sad — while the literate reading is about who controls an artwork's voice on a
rented platform, and about the dialog everyone has learned to distrust being used,
sincerely, to mean farewell. It is fully client-side: no storage, no cookies, no
network of any kind, CC BY-SA, attributed to y-a-v-a and to Ader (P8). Nothing is
saved. That is the whole of it.
