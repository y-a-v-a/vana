# Certificate of Authenticity

A page that issues its own certificate of authenticity. On every load it reads its
own source (`document.documentElement.outerHTML`), computes a SHA-256 digest with
the Web Crypto API, and stamps that digest onto the page as the work's signature.
The certificate is not *about* the work; it is *computed from* the work. The work
authenticates itself, in a closed loop, with no authority outside the page.

The mechanism is the argument (P1). Authenticity in the art market rests on a
certificate — for Donald Judd, Dan Flavin and much of conceptual/multiples art the
**certificate is the real artwork**, and the fabricated object is merely an
instance it licenses. Here the certificate is generated cryptographically, which
makes the institution's promise literal and then voids it: a hash certifies only
that a file is byte-identical to itself, so **every copy that reproduces the
signature is equally authentic**. There is no privileged original, nothing scarce,
nothing to forge. This is the digital readymade (P2) of the authenticity
certificate, restaged as a tautology — and a deadpan jab at the NFT (P6), which
sells exactly this cryptographic gesture as scarcity, on a ledger, for money. This
version uses no ledger, no network, no minting, and ships under an open licence:
the same crypto, none of the fiction.

The infrathin twist (Duchamp, the project's patron saint) is in the timing. The
instant the signature is stamped into the DOM, the document changes — so the
certificate is invalid the moment it is issued. The console attests it: the
"signature at issue" no longer matches the "signature now." A certificate that
cannot survive its own issuance is the smallest possible build of the idea that
authenticity is a snapshot of something already gone (P3).

It reads at two depths (P7): a casual viewer sees an official-looking certificate
with an impressive hash; a literate viewer sees that the hash certifies nothing
but a faithful copy, that the copy and the original are indistinguishable, and that
the page quietly refused every apparatus — server, ledger, scarcity — that would
have turned the gesture into an asset. Dry, not preachy (P9). It could not be a
print: the signature is computed live, client-side, and differs the moment anything
changes (G1, P4). Open licence, no cookies, no trackers, no network (P8).

**References:** Donald Judd and Dan Flavin, certificates of authenticity (the
certificate as the artwork); the NFT / blockchain authenticity discourse;
Marcel Duchamp, *infrathin*; W3C Web Crypto API (SubtleCrypto).
**Principles:** P1, P2, P3, P4, P6, P7, P8, P9.
