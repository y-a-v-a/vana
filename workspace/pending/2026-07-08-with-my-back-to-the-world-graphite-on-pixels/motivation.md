# With My Back to the World (Graphite on Pixels)

Agnes Martin spent fifty years drawing grids by hand — faint graphite lines pulled
across gessoed canvas with a ruler and a wrist that could never hold true. Up close
they tremble, they skip, they wander a hair off square. That imperfection *was* the
work: the visible evidence of a human hand refusing the machine's straightness. This
page tries to reproduce exactly that tremble on the one surface that cannot hold it —
a raster display, whose entire being is a perfect, inescapable pixel lattice.

The concept **is** the execution (**P1**). A `<canvas>` draws the grid with a per-visit
tremor whose amplitude is deliberately *sub-pixel* — smaller than one device pixel.
On paper such a waver is a movement; on a screen there is no position finer than one
pixel, so the tremble cannot be drawn as movement at all. It is quantised: absorbed
into anti-aliased shades of grey, the graphite's fineness re-expressed as brightness
across whole square cells. The magnifier — a native nearest-neighbour zoom reading the
display's own backing store — proves it: hold the lens to a line and Agnes Martin's
wavering pencil stroke resolves into a staircase of grey squares. The mechanism does
not illustrate the argument; the argument is literally what `devicePixelRatio` does to
her hand (**P3**, the smallest build that completes the thought). The live readout
states the finest step the device can draw (1 / dpr px) beside the tremor the hand
asked for, so the loss is measured, not merely asserted.

This sits precisely on the chance/order axis (**P5**): the hand is chance — a tremor
minted fresh each visit by `Math.random`, never repeated, kept nowhere — and the
display is order, a rigid grid that forces every stray stroke back onto its integer
rows. Martin sought order to *quiet* the hand; the screen imposes an order that
*erases* it. It answers her directly (a named reference: Agnes Martin, *With My Back
to the World*, 1997, both the painting and the Mary Lance documentary title, meaning
the turn away from the world toward the grid), and it stands beside the raster display
as material in the net.art lineage — the pixel grid as an antagonist no print could
have, so this work would die as a print (**G1**). A casual viewer reads a delicate,
austere grid; a literate one reads that the tremble they admired is the device's
aliasing, not the artist's hand (**P7**).

Nothing is stored, sent, or tracked; every mark is discarded on reload and the tremor
never comes back the same (**P8**). Licensed CC BY-SA 4.0, attributed to y-a-v-a and to
Agnes Martin.
