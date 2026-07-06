# Unreachable

A small still life is minted per visit and held by exactly one strong pointer.
Press *Release the last pointer* and that reference is dropped. The work does not
vanish. It becomes **unreachable** — present in memory, invisible to you, waiting
for the JavaScript garbage collector to decide there is no one left who remembers
it. That decision is not the artist's and not the viewer's: it belongs to the
runtime, on no schedule anyone can set, at an instant no one can observe. When it
finally comes, the canvas is already blank and only an epitaph remains. Closing the
tab reclaims everything at once — so the death is guaranteed, only its timing is not.

The mechanism *is* the argument (**P1**). This is not an animation of disappearance
on a timer; it is disappearance itself, performed by the engine's memory manager. A
`WeakRef` holds the work without keeping it alive; a `FinalizationRegistry` and a poll
of `weak.deref()` attest the exact moment reachability is lost. The garbage collector
is taken as a **digital readymade** (**P2**): the browser already ships a machine that
quietly destroys anything no longer pointed to, and this work simply points it at a
picture. Because collection is non-deterministic, the piece sits on the *chance* pole
of the DNA's chance/order axis (**P5**): even the coaxing loop that raises memory
pressure is honest — it begs the collector, which stays free to ignore us. That freedom
is the piece. It is the smallest build that completes the thought (**P3**) and lives
only as behaviour (**P4**).

It answers Jean Tinguely's self-destroying *Homage to New York* (1960) and the
**vanitas / memento mori** tradition, but relocates mortality: Tinguely's machine
killed itself on cue, the vanitas skull is a fixed symbol — here death is outsourced
to an indifferent runtime and is genuinely unschedulable. It answers Duchamp's
*infrathin*, the imperceptibly thin transition between two states: the moment an
object passes from reachable to reclaimed is a perfect infrathin — real, decisive,
and structurally impossible to witness (the frame that would show it is the frame
after it is already gone). The found object is the ECMAScript `WeakRef` /
`FinalizationRegistry` spec (TC39, 2021), cited the way earlier works cite Web Crypto
or the CSS Color Module.

Double-coded (**P7**): a casual viewer sees a work you can let die, and a status
light going amber then grey. A literate viewer reads heap reachability, the aura of the
uncapturable instant, and mortality delegated to a scheduler. The ethics are the
delivery (**P8**): CC BY-SA, no cookies, no trackers, no network — the work never
leaves your machine, and neither does its death. The tone is the cheerful cynic
(**P9**): we hand you a button to kill the thing, then admit you were never in charge
of when it dies.
