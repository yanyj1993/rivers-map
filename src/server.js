import Koa from 'koa';
import pageRouter from './routers/page-router';
const app = new Koa();
import Static from 'koa-static';
import path from 'path';

//静态资源
app.use(Static(
    path.join(__dirname, '../resources'),{    //静态文件所在目录
        maxage: 30*24*60*60*1000        //指定静态资源在浏览器中的缓存时间
    }
));

//URL日志
app.use( async ( ctx,next ) => {
    const url = ctx.request.url;
    const method = ctx.request.method;
    console.log(`[${method}] - ${url}`)
    next();
    // ctx.body = url;
});



app.use(pageRouter.routes());
app.use(pageRouter.allowedMethods());

app.listen(3000,e => {console.log("3000启动")});
