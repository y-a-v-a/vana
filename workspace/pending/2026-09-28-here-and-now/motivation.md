# Here and Now

The web's founding miracle is the costless, simultaneous copy: one page can be open in a thousand tabs at once, in a thousand places, identically, forever. Walter Benjamin argued in *The Work of Art in the Age of Mechanical Reproduction* (1935) that this is exactly what the copy lacks and the original keeps — the **aura**, "its presence in time and space, its unique existence at the place where it happens to be." *Here and Now* takes Benjamin at his word and asks the browser to enforce it.

The mechanism is the argument (**P1**). The work binds its own visibility to an **exclusive lock** held through the Web Locks API (`navigator.locks.request(name, {mode:"exclusive"})`). This is the one primitive in the platform whose literal purpose is to forbid simultaneity: at most one holder, everyone else genuinely queued. The gold-ground panel — the aura painted, for once, literally *behind* the figure — is present only in the tab that holds the lock. Open the page a second time and the second tab does not get a copy; it waits, greyed out, truthfully told *"the original is on view in another tab,"* with a live count of how many tabs are in line. Close the first tab and the lock releases; the here-and-now passes to the next in line. Presence becomes scarce not by fiat or fiction but by a concurrency guarantee (**P4** — a behaviour, not an artifact; **P5** — pure order: mutual exclusion is the strictest rule there is).

It answers a specific work in the canon (Benjamin) and a specific gesture in this one. It is the cheerful-cynic inverse of the digital readymade (**P2**): where the web makes copying free, this makes presence exclusive using the web's own plumbing — and is honest about the punchline. The aura it manufactures reaches exactly one browser profile wide; a lock coordinates tabs of one origin in one browser, not the world. So the "unique existence at the place where it happens to be" turns out to be *your laptop*, right now, this tab and no other (**P9** — the joke carries the idea). The casual viewer gets a picture that vanishes when opened twice; the literate viewer gets aura reduced to a mutex (**P7**).

No image is stored, sent, or reproduced (**G4**); there is no network, no cookie, no persistence. The only trace of the work is which tab currently holds it — and the moment you leave, even that is handed away. There is no art piece, only who has it now.

**References:** Walter Benjamin, *The Work of Art in the Age of Mechanical Reproduction* (1935) — the aura, the "here and now." Web-native lineage: the W3C Web Locks API (mutual exclusion) as material.

**Principles:** P1, P2, P4, P5, P7, P9.

**License:** CC BY-SA 4.0, attribution y-a-v-a.
