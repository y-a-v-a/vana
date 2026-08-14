# The Depot

A museum wall of twelve small paintings, all crated in the dark. Nothing is on
view when you arrive. To see a work you must recall it from storage by naming it
in the address bar — every caption is a loan request (`#w-1948-11`). The instant
you name a second work, the first goes back into its crate. You can never see
two at once, and by default you see none.

**The mechanism is the argument (P1, P3).** The whole piece is pure CSS built on
one selector: `:target`. The CSS spec matches `:target` against *at most one*
element per document — the single element whose `id` equals the current URL
fragment — and against *none* when there is no fragment. That is not a metaphor
for museum display policy; it is museum display policy, enforced by the browser.
"One work on view at a time; the rest held in the dark, at your discretion" is
exactly what `:target` does mechanically. There is no JavaScript, no state, no
storage — the exclusivity is structural, guaranteed by the layout engine (P3,
smallest build that completes the thought; a sibling in spirit to the zero-JS
*Scripting: None* and *Balance des Peintres*).

**What it answers (P2, P6, narrative).** It answers Fred Wilson's *Mining the
Museum* (1992), where the artist excavated a historical society's storerooms and
re-hung what the institution had chosen not to show — making visible the
politics of what stays crated. Every museum keeps the overwhelming majority of
its holdings in the depot; visibility is scarce, curated, and rationed. Here that
scarcity is literal: the collection lives entirely in the DOM, but the selector
rations it to one loan at a time. It sits on the *order* side of the chance/order
axis (P5): deterministic, identical in every browser, a rule that admits no
exception. It extends the value-and-authenticity line (P6) — value here is not
price but *display*, the privilege of being lit — and it is web-native in a way a
print cannot touch: the artwork's on/off state is bound to the URL bar, and
addressing is the curatorial act (net.art; distinct from the hash-driven,
JavaScript *If I Say So* and the `:visited` history of *I Went*).

**Double coding (P7, P9).** The casual visitor gets a clean gag — click a label,
a painting lights up, the last one snaps dark; a wall panel offers to "Return
everything to storage." The literate visitor gets the institutional critique and
the fact that the browser's selector spec, not a curator, is drawing the line
between on-view and in-storage. Dry, not preachy: the collection is always there;
the institution simply declines to hang it.

**Ethics (P8).** CC BY-SA 4.0, attribution to y-a-v-a and to Fred Wilson. No
JavaScript, no cookies, no trackers, no external requests — fully self-contained.
