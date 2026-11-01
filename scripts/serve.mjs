import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.env.SERVE_DIR || 'dist');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.webp':'image/webp', '.avif':'image/avif', '.xml':'application/xml', '.txt':'text/plain' };
createServer(async(req,res)=>{
  try {
    let file=resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if (file!==root && !file.startsWith(root+sep)) throw new Error('path');
    if ((await stat(file)).isDirectory()) {
      const requestUrl=new URL(req.url,'http://localhost');
      if(!requestUrl.pathname.endsWith('/')) {res.writeHead(301,{Location:requestUrl.pathname+'/'+requestUrl.search});res.end();return;}
      file=resolve(file,'index.html');
    }
    const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}); res.end(bytes);
  } catch { res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(resolve(root,'404.html')).catch(()=>'<h1>404</h1>')); }
}).listen(Number(process.env.PORT || 4173),'127.0.0.1',()=>console.log(`http://127.0.0.1:${process.env.PORT || 4173}`));
