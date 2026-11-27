const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const PORT = 3047;
const PUBLIC = path.resolve(__dirname, 'public');
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
function json(res, code, value){res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function bodyJSON(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536)throw new Error('Слишком большой запрос');}try{return JSON.parse(raw || '{}');}catch{throw new Error('Некорректный JSON в запросе');}}
async function staticFile(pathname, res){
  let decoded;try{decoded=decodeURIComponent(pathname);}catch{return json(res,400,{error:'Некорректный адрес'});}
  const filepath=path.resolve(PUBLIC,'.'+(decoded==='/'?'/index.html':decoded));
  if(!filepath.startsWith(PUBLIC+path.sep))return json(res,403,{error:'Доступ запрещён'});
  const ext=path.extname(filepath);
  if(!MIME[ext])return json(res,404,{error:'Файл не найден'});
  try{const bytes=await fs.readFile(filepath);res.writeHead(200,{'Content-Type':MIME[ext],'Cache-Control':'no-store'});res.end(bytes);}catch{json(res,404,{error:'Файл не найден'});}
}
let tasks=[
 {id:201,title:'Подготовить кабинеты к событию',category:'Организация',priority:'Высокий',done:false},
 {id:202,title:'Проверить проекторы',category:'Техника',priority:'Средний',done:false},
 {id:203,title:'Раздать материалы',category:'Организация',priority:'Низкий',done:true}
];let nextId=204;
async function handleApi(req,res,url){
 if(url.pathname==='/api/tasks'&&req.method==='GET')return json(res,200,{items:tasks,total:tasks.length});
 if(url.pathname==='/api/tasks'&&req.method==='POST'){
   const data=await bodyJSON(req);const title=String(data.title||'').trim();const category=String(data.category||'').trim();
   const priority=String(data.priority||'Средний');
   if(title.length<4||!['Организация','Техника','Логистика'].includes(category)||!['Низкий','Средний','Высокий'].includes(priority))return json(res,422,{error:'Некорректные данные новой задачи'});
   const item={id:nextId++,title,category,priority,done:false};tasks.unshift(item);return json(res,201,{item});
 }
 const match=url.pathname.match(/^\/api\/tasks\/(\d+)$/);
 if(match){
   const id=Number(match[1]);const item=tasks.find(t=>t.id===id);
   if(!item)return json(res,404,{error:'Задача не найдена'});
   if(req.method==='PATCH'){const payload=await bodyJSON(req);if(typeof payload.done!=='boolean')return json(res,422,{error:'Поле done должно быть boolean'});item.done=payload.done;return json(res,200,{item});}
   if(req.method==='DELETE'){tasks=tasks.filter(t=>t.id!==id);res.writeHead(204,{'Cache-Control':'no-store'});return res.end();}
 }
 return json(res,404,{error:'Маршрут API не найден'});
}
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.startsWith('/api/')){
    try{await handleApi(req,res,url);}catch(err){json(res,400,{error:err.message||'Ошибка данных'});}return;
  }
  if(req.method!=='GET')return json(res,405,{error:'Метод не поддерживается'});
  await staticFile(url.pathname,res);
});
server.listen(PORT,()=>console.log(`Откройте http://localhost:${PORT}`));
