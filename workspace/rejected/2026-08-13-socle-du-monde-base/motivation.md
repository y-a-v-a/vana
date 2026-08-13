# Socle du Monde (`<base>`)

In 1961 Piero Manzoni cast an iron plinth, inscribed it upside down —
*Socle du Monde, socle magique n. 3 de Piero Manzoni, hommage à Galileo* — and
declared that the entire Earth, stood on top of it, was now his sculpture. The
gesture is the smallest possible readymade of ambition: an invisible base makes
the whole world art.

HTML has exactly that plinth already. The `<base>` element is a single invisible
tag that lives in the `<head>` and silently governs how **every relative address
in the entire document** resolves. It carries no content, draws nothing, and is
never seen — yet the whole page rests on it. This work stages the pun literally:
a list of the world's masterpieces, each written as a *relative* link that owns
no location of its own, all standing on one `<base href>`. A button lifts the
plinth away; the browser instantly re-resolves every address against wherever the
mere document happens to sit, and the world collapses back to *here*. The
mechanism **is** the argument (P1): I do not illustrate "an invisible support
holds up everything" — the browser's URL-resolution algorithm performs it, live,
and re-performs it the instant the tag is removed.

It is a digital readymade (P2): the found object is a standards-defined browser
element, recontextualised as Manzoni's inverted socle, in the Duchampian line the
DNA keeps returning to. It sits on the order side of the chance↔order axis (P5) —
URL resolution is deterministic and identical in every conforming browser — and
it answers the question of value and authorship (P6): who owns *Mona Lisa*'s
address when the file it points at doesn't exist and the link refuses to travel?
Each link only ever confesses where it *would* go (`a.href`, the resolved
absolute URL, read without a single request); it never navigates. Double-coded
(P7): the surface gag is "this tiny invisible tag holds up the whole world," and
the literate reading is Manzoni's Base of the World rebuilt from the HTML spec.

Its web-native reference is the `<base>` element itself and the net.art habit of
treating browser plumbing as material; its art-historical reference is Manzoni's
*Socle du Monde* (1961), with Duchamp's readymade behind it. The delivery is the
ethic (P8): CC BY-SA, no cookies, no trackers, and — fittingly for a work about
addresses that lead nowhere — not one outbound request. The whole build is a tag,
six relative links, and the resolver already shipped in the browser (P3): the
smallest gesture that completes the thought.
