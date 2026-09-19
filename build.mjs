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
