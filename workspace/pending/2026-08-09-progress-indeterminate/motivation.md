# Progress (Indeterminate)

Modernism sold art a story about itself: that it *advances*. Greenberg's
"Modernist Painting" (1960) promised each medium would purify itself toward
its own irreducible edge; Alfred Barr's 1936 flowchart drew the arrows of that
march forward from Impressionism into abstraction, one movement superseding the
last. This work hands that teleology to the one web element built to depict it
and nothing else: the native HTML `<progress>` bar. Given a `value`, a progress
bar reports how far along a task is. Withhold the `value` and it becomes
*indeterminate* — the browser is obliged to animate striving, endlessly, toward
a completion it was never told about. Six movements, six bars, none advancing.
Art is making progress. Please wait.

The mechanism is the argument (**P1**): I do not illustrate the myth of
artistic progress, I run it. An indeterminate bar cannot fill — that is what
"indeterminate" means in the spec — so the piece can only ever be *almost*
done, which is exactly modernism's forward-tense promise rendered in HTML.
Crucially the widget is left **as manufactured** (**P2**, Duchamp's readymade):
no `appearance: none`, no custom animation. Its colour, texture and gait are
drawn by your browser and OS, so "progress" looks different on every device and
is authored by none of us. Ask your system for less motion and the bars freeze:
`prefers-reduced-motion` stops progress altogether — an honest accessibility
default that also happens to be the punchline.

The build is the smallest that completes the thought (**P3**): declarative
markup, one stylesheet, and a single script whose only job is to count how long
you have waited — measuring patience, never progress. It is a live behaviour,
not a fixed artifact (**P4**): a print of a progress bar is a lie about a
progress bar. It reads at two depths (**P7**): a casual visitor sees a stack of
loading bars and the dry line "Art is making progress. Please wait"; a literate
one sees Greenberg and Barr answered by the browser's own default widget. The
wit carries the idea rather than replacing it (**P9**) — the cheerful cynic
notes that the web already embodied the twentieth century's favourite promise
and quietly declined to keep it.

References answered: Clement Greenberg, "Modernist Painting" (1960); Alfred H.
Barr Jr., *Cubism and Abstract Art* flowchart (MoMA, 1936); Marcel Duchamp /
the readymade (the vendor-drawn native widget, unstyled). It sits as a node in
the twenty-year argument that the internet already performs the gestures of
modern art — here, the gesture of *advancing* — under an open licence, with no
cookies, no trackers, no storage and no network.
