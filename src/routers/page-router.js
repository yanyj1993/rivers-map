import Router from 'koa-router';
import {renderFile} from "../utils/common";

const router = Router();
router.prefix(`/rivers-map`);
//配置页面
router.get('/', async (ctx, next) => {
    ctx.type = 'html';
    ctx.body = renderFile('/index.html');
});

export default router;
