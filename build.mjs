import {readFile,writeFile,mkdir} from 'node:fs/promises';
const html = await readFile('public/host.html','utf8');
const css = await readFile('public/host.css','utf8');
const js = await readFile('public/host.js','utf8');
await mkdir('codepen',{recursive:true});
for(let i=1;i<=5;i++) {
 const title = `Testing postMessage · Demo ${i}`;
 const data = {title,description:'Interactive iframe resize experiments: origin, source, and payload validation.',html,css,js:`window.DEMO_NUMBER = ${i};\n${js}`,tags:['postmessage','iframe','security'],editors:'001',layout:'left'};
 await writeFile(`codepen/demo-${i}.json`,JSON.stringify(data,null,2));
 await writeFile(`public/demo-${i}.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="host.css">${html}<script>window.DEMO_NUMBER=${i};if(location.hostname==='localhost')window.WIDGET_URL='http://localhost:4174/widget.html';else window.WIDGET_URL=new URL('widget.html',location.href).href;</script><script src="host.js"></script></html>`);
}
const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
for(let i=1;i<=5;i++) {
 const data = JSON.parse(await readFile(`codepen/demo-${i}.json`,'utf8'));
 const embed = `<div class="codepen" data-prefill="${escape(JSON.stringify({title:data.title}))}" data-height="920" data-theme-id="light" data-default-tab="result"><pre data-lang="html">${escape(data.html)}</pre><pre data-lang="css">${escape(data.css)}</pre><pre data-lang="js">${escape(data.js)}</pre></div><script async src="https://public.codepenassets.com/embed/index.js"></script>`;
 const form = `<form action="https://codepen.io/pen/define/" method="POST"><input type="hidden" name="data" value="${escape(JSON.stringify(data))}"><button>Open demo ${i} in the CodePen editor</button></form>`;
 await writeFile(`public/codepen-${i}.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${data.title}</title><style>body{margin:0;background:#f8f5ee;color:#29352f;font:14px/1.5 sans-serif}nav{display:flex;align-items:center;justify-content:space-between;padding:12px;gap:12px}button{padding:8px 12px;cursor:pointer}a{color:#386244}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><nav><a href="../">All demos</a>${form}</nav>${embed}</html>`);
 await writeFile(`codepen/embed-${i}.html`,embed);
}
