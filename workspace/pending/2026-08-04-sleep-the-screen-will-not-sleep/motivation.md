# Sleep (The Screen Will Not Sleep)

In 1963 Andy Warhol pointed a fixed camera at the poet John Giorno and let it
run: *Sleep*, roughly five hours and twenty-one minutes of a man doing almost
nothing. It is anti-cinema — no plot, no cut, no reward — a durational test of
whether the viewer will keep watching. This page answers *Sleep* with the one
piece of web machinery that shares its exact subject: the **Screen Wake Lock
API**, the browser's power to tell the operating system *do not fall asleep*.

The mechanism is the argument (**P1**). To keep a five-hour vigil over a
sleeper, the artwork must forbid your device from resting — so it requests a
screen wake lock, and a live counter accrues only while the lock is held *and*
the tab is visible. The moment you switch tabs the specification releases the
lock automatically; the page catches `visibilitychange`, stops crediting the
vigil, and prints "you looked away." Warhol's endurance piece is thereby
re-staged as a literal contract between the viewer's attention and the machine's
sleep: the concept (a refusal to let sleep end) and the execution (an OS-level
sleep, withheld) are the same object. Only the sleeper on screen is drawn — a
soft breathing mound under film grain, generated per frame, never footage,
never fetched.

It is a **digital readymade** (**P2**): the wake lock is an off-the-shelf
device behaviour, invented so map apps and recipes stay lit, recontextualised
into a work about watching someone sleep. It sits on the **chance/order** axis
(**P5**) at the order pole — a strict rule (visible + awake ⇒ time counts)
metering an otherwise eventless stream — and it keeps the **live, not fixed**
ethic (**P4**): reload and the vigil is zero again; nothing persists. The
double-coding (**P7**) is dry and cheerful-cynic (**P9**): the casual viewer
gets the gag — *a film about sleep that won't let the screen sleep* — while the
literate viewer reads a note on duration, attention economies, and the fact
that "keeping watch" is now an API call your browser can simply refuse
(`(Your browser withholds the Wake Lock API…)`), leaving the vigil impossible on
that device, the way Vanitas cannot read a battery that no longer reports.

The web-native ethic is on the wall label (**P8**): CC BY-NC 4.0, credit to
y-a-v-a and to Warhol's *Sleep*, no cookies, no storage, no network of any kind.
The whole work is one self-contained page whose only material besides the
breathing grain is the sleep of the machine it runs on — the smallest build that
completes the thought (**P3**).
