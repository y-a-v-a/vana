# Pierced Form (Carve to Open)

In 1931 Barbara Hepworth pierced a block of stone straight through and
declared that the hole, not the stone, was the work. The pierced form made the
absence the subject: the solid is demoted to an edge for the opening. This piece
takes her at her word by refusing to supply any stone at all. There is no image,
no SVG, no canvas — nothing is painted. The only artwork on the page is a region
the browser's layout engine has been *forbidden* to fill. The running prose meets
the boundary of a shape that has no colour, border, or pixels of its own, and
turns aside. The void is constituted entirely by the text's refusal to enter it.

**The mechanism is the argument (P1, G3).** The hole is a CSS `shape-outside`
exclusion — two transparent `<b>` elements carved into circles. They are present
to the layout algorithm and absent to the eye: they occupy no visual space, only
*forbidden* space. So the work literally enacts Hepworth's claim that the hole is
the subject and the mass merely its support — the mass here is deleted outright,
and the opening survives alone as pure negative geometry. A casual viewer sees
prose bending inexplicably around nothing; a reader who knows the pierced form
sees the whole art-historical argument executed in the cascade (P7). The `carve`
range input hands over the chisel: enlarging the radius makes the words retreat —
revelation by subtraction — and closing it to zero heals the stone back into an
uncarved rectangular block, the sculpture un-made (P4).

**Digital readymade (P2) on the chance↔order axis (P5).** The found object is a
plumbing feature of the browser — CSS Shapes / text exclusion — appropriated as
sculpture. The circle is strict rule (order); where each word happens to break
along its arc is left to the reflow engine, the viewport, and the device (chance),
so no two renderings carve identically and the opening keeps no record of itself.
Smallest build that completes the thought (P3): a dozen lines of CSS, a four-line
script, no dependencies, no network, no storage.

**References answered.** Barbara Hepworth, *Pierced Form* (1931) and the lifelong
pierced-stone series; Henry Moore, the hole as positive form; and the web-native
CSS Shapes specification (`shape-outside`) as the material. It sits in the
twenty-year argument as another node where a canonical 20th-century gesture turns
out to be already built into the web — this time, that the subject of a sculpture
can be the part that is not there.

**Ethics (P8, G4).** Creative Commons BY-SA 4.0, attribution to y-a-v-a and to
Hepworth stated on the page. No cookies, trackers, network requests, or storage
of any kind; the file is fully self-contained. As the footer notes, the one thing
missing from view-source is the sculpture itself.
