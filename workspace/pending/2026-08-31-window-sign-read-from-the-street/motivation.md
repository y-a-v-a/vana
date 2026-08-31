# Window Sign (Read from the Street)

Bruce Nauman's neon signs hang in the glass of a window or curl into a spiral, and they
read two ways at once: forward to the person standing inside, backward to the passer-by
on the street looking in through the pane. The same tubes, two texts, decided entirely by
which side of the glass you stand on. This work moves that window onto the web and asks
who stands on which side now.

The mechanism is the argument (**P1**). A short marquee is stored in the DOM **reversed**,
letter for letter. CSS `unicode-bidi: bidi-override; direction: rtl` forces the layout
engine to lay those characters out right-to-left, so your eye — standing *inside* — reads
the sentence perfectly forward. But every machine reads the raw source: the clipboard copies
the reversed string, Find-in-page matches only the backward spelling, a crawler indexes
gibberish, a screen reader recites the back of the glass. The reversal isn't illustrated by
the code; the text engine literally performs it. Select the neon and paste it anywhere, or
type the words you can plainly read into the search box: the machine, out on the street,
gets only the mirror. The reproduction you carry away is never the original you saw
(**P7**, double-coded; **P6/authenticity**).

It answers **Bruce Nauman**'s window and spiral neons directly, and enlists two web-native
saints: the Unicode Bidirectional Algorithm and the *Trojan Source* attack (Boucher &
Anderson, 2021), which weaponised exactly this gap — source that reads one way to a human
and another to a compiler. It is the deliberate inverse of y-a-v-a's own *Scrittura
Speculare* (2026), where CSS `scaleX(-1)` shows the **eye** a mirror while the machine reads
straight; here the eye reads straight and the **machine** gets the mirror. The two works are
the two sides of the same pane. This sits on the **order** end of the chance/order axis
(**P5**): the reversal is exact and deterministic, identical in every conforming browser.

Ethics are part of the piece (**P8**): Creative Commons (CC BY-SA 4.0), attribution to
y-a-v-a and to Nauman, no cookies, no trackers, no network request of any kind, everything
client-side. It is the smallest build that completes the thought (**P3**) — one CSS rule
does the whole job; the JavaScript only reverses the string honestly and lets you watch the
machine disagree with your eye. It could not survive as a print: paper has one fixed reading
order, and the entire work is the divergence between two.
