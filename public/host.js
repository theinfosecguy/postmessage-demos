(() => {
const DEMO = window.DEMO_NUMBER || 5;
const WIDGET_URL = window.WIDGET_URL || 'https://theinfosecguy.github.io/postmessage-demos/public/widget.html';
const WIDGET_ORIGIN = new URL(WIDGET_URL).origin;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = 1200;
const $ = selector => document.querySelector(selector);
const iframe = $('#widget');
const titles = ['The happy path','The wrong origin','The right origin. The wrong window.','A billion pixels of valid data','The handler that says why'];
const intros = [
 'Add a reply inside the widget. It measures its content, sends a resize message, and the host accepts it without checking the sender.',
 'Send a forged resize from the red frame. Try it before and after enabling the exact origin check.',
 'Widget B shares A’s origin. Send from B, then enable the source check to tie resizing to one specific window.',
 'These messages really come from widget A. Try malformed data, then enable shape validation and the 100–1200 px clamp.',
 'Origin, source, and payload checks are all active. Try each sender and payload; the log explains every decision.'
];
$('#step').textContent = `postMessage lab / ${String(DEMO).padStart(2,'0')}`;
$('#title').textContent = titles[DEMO-1]; $('#intro').textContent = intros[DEMO-1];
$('#expected-origin').textContent = WIDGET_ORIGIN;
$('#fix-label').hidden = DEMO === 1 || DEMO === 5;
$('#fix-text').textContent = ({2:'Check exact origin',3:'Check the source window',4:'Validate payload + clamp height'})[DEMO] || '';
$('#hostile').hidden = ![2,5].includes(DEMO); $('#sibling').hidden = ![3,5].includes(DEMO);
$('#recovery').hidden = DEMO < 4;
let count = 0;
// Structured clone can deliver cycles, BigInt, Date, Map, and Set. The formatter
// must survive all of them, so it tracks visited objects and bounds depth,
// entries per object, and total output length.
const PRINT_DEPTH = 4, PRINT_ENTRIES = 12, PRINT_LENGTH = 600;
function print(value) {
 const text = format(value, new Set(), 0);
 return text.length > PRINT_LENGTH ? `${text.slice(0, PRINT_LENGTH)} … (${text.length} chars)` : text;
}
function format(value, seen, depth) {
 if (typeof value === 'bigint') return `${value}n`;
 if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
 if (value instanceof Date) return Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString();
 if (value instanceof Map || value instanceof Set) return `${value.constructor.name}(${value.size})`;
 if (value && typeof value === 'object') {
  if (seen.has(value)) return '[circular]';
  if (depth >= PRINT_DEPTH) return Array.isArray(value) ? '[…]' : '{…}';
  seen.add(value);
  const entries = Array.isArray(value)
   ? value.slice(0, PRINT_ENTRIES).map(v => format(v, seen, depth + 1))
   : Object.entries(value).slice(0, PRINT_ENTRIES).map(([k, v]) => `${JSON.stringify(k)}: ${format(v, seen, depth + 1)}`);
  const total = Array.isArray(value) ? value.length : Object.keys(value).length;
  if (total > PRINT_ENTRIES) entries.push(`… ${total - PRINT_ENTRIES} more`);
  seen.delete(value);
  return Array.isArray(value) ? `[${entries.join(', ')}]` : `{${entries.join(', ')}}`;
 }
 return String(JSON.stringify(value));
}
function log(kind, message, event) {
 const item = document.createElement('li'); item.className = kind;
 const heading = document.createElement('strong'); heading.textContent = `${++count}. ${message}`; item.append(heading);
 if(event) {
  const meta = document.createElement('small');
  const source = event.source === iframe.contentWindow ? 'Widget A' : event.source === $('#sibling').contentWindow ? 'Widget B' : event.source === $('#hostile').contentWindow ? 'Hostile frame' : 'Other window';
  meta.textContent = `${source} · origin: ${event.origin}`; item.append(meta);
  const payload = document.createElement('code'); payload.textContent = print(event.data); item.append(payload);
 }
 $('#log').prepend(item); while($('#log').children.length > 40) $('#log').lastElementChild.remove();
}
function flags() { const fixed = $('#fix').checked; return { origin: DEMO >= 3 || (DEMO === 2 && fixed), source: DEMO >= 4 || (DEMO === 3 && fixed), payload: DEMO === 5 || (DEMO === 4 && fixed) }; }
function apply(height) { iframe.style.height = `${height}px`; $('#height').textContent = `A · ${iframe.style.height} requested`; }
window.addEventListener('message', event => {
 // Ignore editor/platform chatter. Every event from our three demo frames reaches the handler.
 if (![iframe.contentWindow,$('#sibling').contentWindow,$('#hostile').contentWindow].includes(event.source)) return;
 const checks = flags();
 if(checks.origin && event.origin !== WIDGET_ORIGIN) { log('rejected',`Rejected: unexpected origin ${event.origin}`,event); return; }
 if(checks.source && event.source !== iframe.contentWindow) { log('rejected','Rejected: message came from a different window',event); return; }
 const data = event.data;
 if(!checks.payload) {
  try { const before = iframe.style.height; apply(data.height); log('unsafe', iframe.style.height === before && `${data.height}px` !== before ? 'Unchecked: browser ignored an invalid CSS height' : `Unchecked: resized to ${iframe.style.height}`, event); }
  catch(error) { log('unsafe',`Unchecked handler threw ${error.name}: payload cannot be read`,event); }
  return;
 }
 if(typeof data !== 'object' || data === null || Array.isArray(data) || data.type !== 'resize') { log('rejected','Rejected: payload is not a resize message',event); return; }
 // Deliberately require a number. Number(null), Number(true), and Number('') are finite.
 if(typeof data.height !== 'number' || !Number.isFinite(data.height)) { log('rejected','Rejected: height must be a finite number',event); return; }
 const height = Math.min(Math.max(data.height,MIN_HEIGHT),MAX_HEIGHT);
 apply(height);
 log(height === data.height ? 'accepted' : 'clamped',height === data.height ? `Accepted: resized to ${height}px` : `Clamped: ${data.height} → ${height}px`,event);
});
function widgetUrl(role) { const u = new URL(WIDGET_URL); u.searchParams.set('hostOrigin',location.origin); u.searchParams.set('role',role); u.searchParams.set('payloads',DEMO >= 4 ? '1':'0'); return u.href; }
function loadFrames() {
 iframe.style.height = '220px'; $('#height').textContent = 'A · 220px';
 iframe.src = widgetUrl('primary');
 if(!$('#sibling').hidden) $('#sibling').src = widgetUrl('sibling');
 if(!$('#hostile').hidden) {
  // srcdoc inherits the host origin. On CodePen this differs from the GitHub Pages widget origin.
  // Standalone same-origin previews use an opaque sandbox origin, shown honestly as "null".
  const hostile = $('#hostile');
  hostile.setAttribute('sandbox',location.origin === WIDGET_ORIGIN ? 'allow-scripts' : 'allow-scripts allow-same-origin');
  hostile.srcdoc = `<!doctype html><html lang="en"><meta charset="utf-8"><style>body{margin:0;padding:16px;font:14px/1.4 'Avenir Next',Segoe UI,sans-serif;background:#f9e5dc;color:#7c2e21}h3{margin:0 0 7px;font-size:15px}p{margin:0 0 12px}button{padding:9px;border:1px solid #b25a43;background:#fff6ef;color:#792d21;cursor:pointer}button:focus-visible{outline:3px solid #7c2e21}</style><h3>Hostile frame · wrong origin</h3><p>This frame asks the host to collapse widget A.</p><button onclick='parent.postMessage({type:"resize",height:1},${JSON.stringify(location.origin)})'>Send forged resize → 1px</button></html>`;
 }
}
function showCode() {
 const c = flags(); $('#mode').textContent = (DEMO===1 ? 'No checks' : DEMO===5 ? 'All checks active' : $('#fix').checked ? 'After the fix' : 'Before the fix') + ' · core excerpt';
 let lines = ["window.addEventListener('message', (event) => {"];
 if(c.origin) lines.push("  if (event.origin !== WIDGET_ORIGIN) return;");
 if(c.source) lines.push("  if (event.source !== iframe.contentWindow) return;");
 if(c.payload) lines.push("  const data = event.data;", "  if (typeof data !== 'object' || data === null ||", "      Array.isArray(data) || data.type !== 'resize') return;", "  if (typeof data.height !== 'number' ||", "      !Number.isFinite(data.height)) return;", "  const height = Math.min(Math.max(data.height, 100), 1200);", "  iframe.style.height = `${height}px`;");
 else lines.push("  iframe.style.height = `${event.data.height}px`;");
 lines.push('});'); $('#handler-code').textContent = lines.join('\n');
}
$('#fix').onchange = () => { showCode(); log('info','Handler changed; widget reset. Repeat the same attack.'); loadFrames(); };
$('#reset').onclick = () => { $('#log').replaceChildren(); count=0; loadFrames(); log('info','Reset. Waiting for widget A.'); };
$('#clear').onclick = () => { $('#log').replaceChildren(); count=0; };
$('#quick-send').onclick = () => iframe.contentWindow.postMessage({type:'demo-control',action:'payload',key:$('#quick-payload').value},WIDGET_ORIGIN);
showCode(); loadFrames();
})();
