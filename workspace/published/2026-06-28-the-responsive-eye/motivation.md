# The Responsive Eye

A full-screen black-and-white radial grating turns by a fraction of a degree each
frame. Near the centre each sector is narrower than one of your device's pixels, so
the picture there cannot be resolved — and what you actually see, the shimmering
wheels and throb, exists nowhere in the geometry. It is interference between the
drawn order and your screen's physical raster, rendered at the live `devicePixelRatio`.
The painting is therefore different on every monitor, present only while it moves, and
killed the moment you try to keep it: a screenshot freezes one frame into a dead still.

The title puns the term that Op art and the web share. *The Responsive Eye* was the
1965 MoMA exhibition that made Bridget Riley famous and then watched her work bleed
onto dress fabric and shop windows — reproduction she publicly fought. "Responsive" is
also the web's word for a layout that conforms to its device. Here the two meanings are
the same event: the work responds to the eye and to the pixel grid, and refuses to hold
a fixed, reproducible image. This answers Riley directly, and answers Walter Benjamin's
*The Work of Art in the Age of Mechanical Reproduction* (1935) with a small joke — a
picture whose aura is exactly its non-reproducibility, restored by the very screen that
was supposed to dissolve it.

It enacts the chance/order axis (**P5**): a perfectly deterministic grating (order)
generates moiré that no one can predict for a given device (chance in the eye). The
mechanism *is* the argument (**P1**) — the shimmer is not decoration painted onto a
concept of "reproduction"; the `requestAnimationFrame` loop running against the LCD grid
literally is the thing that cannot be screenshotted. It is live, not fixed (**P4**), and
the smallest build that completes the thought: one rotating grating, no controls,
no assets (**P3**). It reads at two depths (**P7**) — a cheap optical thrill for the
casual visitor, Riley's reproduction grievance and Benjamin's aura for the literate one.

The honesty is built in. Set your system to *prefers-reduced-motion: reduce* and the
page does the considerate thing — it stops — which hands you precisely the corpse the
label warned about, a still labelled as such. The accessibility preference that protects
you from Op art's flicker is the same gesture that performs the work's death. Open
licence, no cookies, no network, no capture of any kind: the only thing it asks of you is
that you look while it lasts.
