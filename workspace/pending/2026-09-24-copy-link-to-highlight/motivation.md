# Copy Link to Highlight

A short text sits in a reading room and invites you to quote it. You select a
sentence and reach for your browser's own *Copy Link to Highlight* — or open one
of the citation links the page builds from its own words. The browser scrolls to
the passage and paints it yellow. It has done exactly what you asked. But it has
told the page nothing. The web's Text Fragments directive (`#:~:text=`) is
stripped from `location.hash` by design — a deliberate privacy decision so that a
page cannot learn which of its words a reader arrived to see. So the highlight
glows on screen while the page's own JavaScript, checking on every `hashchange`,
`focus` and reopen, reports the same figure forever: **quotes the work can read: 0.**

The mechanism *is* the argument (P1). This is not a picture of blindness with a
caption; the blindness is the browser behaviour itself. The quotation is authored
entirely from *outside* the work — by the reader, in the address bar — and the
work has no organ to perceive it, consent to it, or resent it. Roland Barthes
said a text is "a tissue of quotations"; here the tissue is cut by hands the
tissue cannot feel. Walter Benjamin dreamed, in *The Arcades Project*, of a work
made only of quotations — "I needn't say anything. Merely show." The page shows,
and is shown, and never sees the showing. It answers Rauschenberg's *This Is a
Portrait of Iris Clert If I Say So* (1961) from the far side: say I said anything
at all, and — because I cannot check — I did.

The found object is the browser affordance named literally in the title
(P2): *Copy Link to Highlight* is a readymade menu item, the web's own quotation
instrument, dropped onto a plinth. The work is live and URL-bound rather than
fixed (P4): it exists only in the act of being cited, and the citation lives in
the fragment directive, not in the document. It reads at two depths (P7) — a dry
gag about a page that can't see its own highlighter, and, underneath, a precise
argument about authorship, appropriation and the reader's silent editorial power.
The tone is the cheerful cynic (P9): the text consents "in advance to all of it,
which is the same as consenting to none."

It is distinct from the earlier highlight/selection works in the catalogue: *A
Humument* reads the user's selection through the Selection API (JS *can* see it),
*Rubrica* paints highlights the page itself authors via the Custom Highlight API,
and *Cerca Trova* reveals hidden content through Find-in-page. Here the highlight
is authored by the URL and the reader, and is constitutionally invisible to the
page — the opposite arrangement. Fully self-contained, no network, no cookies, no
storage, no trackers; CC BY-SA 4.0, attributed to y-a-v-a, Benjamin, Barthes and
Rauschenberg, and to the WICG Text Fragments specification whose privacy clause
is the whole point.
