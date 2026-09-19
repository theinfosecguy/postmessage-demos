# Testing an iframe's postMessage handler

Five editable browser demos for an article about validating iframe resize messages.

## Live demos

1. [The happy path](https://codepen.io/the_infosec_guy/pen/GgWrzgL)
2. [The wrong origin](https://codepen.io/the_infosec_guy/pen/wBJgNav)
3. [The right origin, wrong window](https://codepen.io/the_infosec_guy/pen/NPpdoqq)
4. [Malformed payloads and clamping](https://codepen.io/the_infosec_guy/pen/yyMgZNV)
5. [The complete handler](https://codepen.io/the_infosec_guy/pen/jEBydPq)

Save changes in a Pen to update its existing article embed. Widget changes are published through this repository. The `public/codepen-N.html` pages are optional prefilled alternatives generated from the repository; they do not modify the saved Pens. `codepen/pens.json` records the saved Pen URLs.

## Run locally

Run `python3 serve.py`, then open http://localhost:4173/demo-1.html (through demo-5.html).
The host uses port 4173 and widgets use port 4174: two real origins. No packages or build server needed.

## Files to edit

- `public/widget.html`: the actual iframe sender, including widget B and the payload menu.
- `public/host.html`: shared demo markup.
- `public/host.css`: shared styles.
- `public/host.js`: the receiver, validation, logging, and demo controls.
- `build.mjs`: generates standalone previews and CodePen payloads for all five lessons.
- `codepen/demo-N.json`: HTML, CSS, and JS to paste into the corresponding CodePen panels.

After edits, run `node build.mjs`. GitHub Pages publishes the repository root, with runnable demos under `public/`. Widget changes then reach every Pen. To update host code in existing Pens, replace their panels using the corresponding generated JSON values and save. Preserve the `window.DEMO_NUMBER` line in each JS panel.

## Lessons

1. Happy-path resize, without receiver validation.
2. Wrong-origin collapse before and after an exact origin check.
3. Same-origin sibling before and after checking `event.source`.
4. Trusted-widget payloads before and after validation and clamping.
5. Complete handler, all attacks active.

## What is real, and what is scaffolding?

All resize messages are emitted by actual iframe windows using `postMessage`; no synthetic MessageEvents or forged origin labels are used. The host's quick payload menu sends a separate control message to A, which validates its parent and emits the selected payload itself.

CodePen serves the host; GitHub Pages serves A and B. The hostile `srcdoc` frame inherits the CodePen host origin, so its origin differs from the widget's. The local two-port setup models the same relationship.

The standalone GitHub Pages previews serve host and widgets on one origin. For those previews only, the hostile frame is sandboxed without `allow-same-origin`, giving it a real opaque origin displayed as `null`. Use the CodePens or local two-port setup when demonstrating the ordinary host-versus-widget cross-origin boundary. Separate repository paths on one GitHub Pages hostname are not separate origins.

The receiving demo filters out editor/platform chatter before the instructional handler and shows at most 40 log entries. This is presentation scaffolding, not a substitute for the origin/source checks. All three demonstration senders reach the instructional handler. The naive handler catches errors to keep the lab usable; real naive code reading `null.height` would throw.

The iframe's containing viewport scrolls independently. It does not clamp the iframe's CSS height. The requested CSS height is displayed; browser layout engines may impose their own internal maximum for enormous values.

The widget accepts a parent origin in its URL because this is a public, nonsensitive playground designed for embedding. In production, a query parameter alone is not authorization: enforce your own allowed-host policy before sharing sensitive data.

The strict payload handler requires a finite **number** and rejects arrays. It deliberately rejects numeric strings, `null`, and booleans rather than coercing them with `Number()`. Valid finite heights outside 100–1200 are clamped, not rejected.

## Browser checks

See `tests/manual-checks.md` for the repeatable browser test matrix.
