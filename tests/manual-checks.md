# Browser verification

Run `python3 serve.py`, then use the demo URLs on localhost:4173.

- Demo 1: click Add a reply; A grows and the log reports the incoming event from localhost:4174.
- Demo 2 before: hostile frame sets A to 1px. Enable origin check; repeat; unexpected origin is rejected and A stays at its reset height.
- Demo 3 before: B sets A to 80px. Enable source check; repeat; different window is rejected despite the same localhost:4174 origin.
- Demo 4 before: a null payload throws a caught TypeError; a billion-pixel payload is applied without validation. Enable validation; repeat payload tests below.
- Demo 5: wrong origin rejected; B rejected; valid A messages accepted.

Payload matrix (Demo 4 after / Demo 5):

| Payload | Expected |
| --- | --- |
| 1e9 | Clamp to 1200px |
| -50 | Clamp to 100px |
| bare string, null, missing type, wrong type, array | Reject shape |
| missing height, NaN, Infinity, numeric string, null height, boolean | Reject finite-number requirement |
| 350 | Accept 350px |

After a rejection, A's height must not change. Reset must restore a usable widget. Clear must empty the log. All controls must remain keyboard accessible. Repeat at a narrow viewport. On the published CodePens, verify the origin log reports the live CodePen origin and GitHub Pages origin rather than localhost.
