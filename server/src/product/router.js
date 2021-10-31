//  structure:
//      -> store - db part
//      -> router - define endpoints
//      -> index - export router

import Router from 'koa-router';
import productStore from './store';
import { broadcast } from "../utils";

export const router = new Router();

// get products of logged user
router.get('/', async (ctx) => { //ctx = { request, response, state }
    const response = ctx.response;
    const userId = ctx.state.user._id; //logged in user
    response.body = await productStore.find({ userId });
    response.status = 200; //ok
});

router.get('/:id', async (ctx) => {
    const userId = ctx.state.user._id;
    const product = await productStore.findOne({ _id: ctx.params.id });
    const response = ctx.response;
    if (product) {
        if(product.userId === userId) {
            response.body = product;
            response.status = 200; //ok
        }
        else {
            response.status = 403; //forbidden
        }
    } else {
        response.status = 404; //not found
    }
});

const createProduct = async (ctx, product, response) => {
    try {
        const userId = ctx.state.user._id;
        product.userId = userId;
        response.body = await productStore.insert(product);
        response.status = 201; //cerated
        broadcast(userId, { type: 'created', payload: note });
    } catch (err) {
        response.body = { message: err.message };
        response.status = 400; //bad request
    }
}

router.post('/', async ctx => await createProduct(ctx, ctx.request.body, ctx.response));

router.put('/:id', async (ctx) => {
    const product = ctx.request.body;
    const id = ctx.params.id;
    const productId = product._id;
    const response = ctx.response;
    if(productId && productId !== id) {
        response.body = { message: 'Param id and body _id shoul be the same' };
        response.status = 400; //bad request
    }
    if(!productId) {
        await createProduct(ctx, product, response);
    } else {
        const userId = ctx.state.user._id;
        product.userId = userId;
        const updateCount = await productStore.update({ _id: id }, product);
        if (updateCount === 1) {
            response.body = product;
            response.status = 200; //ok
            broadcast(userId, { type: 'updated', payload: product });
        } else {
            response.body = { message: 'Resource no longer exists' };
            response.status = 405; //method not allowed
        }
    }
});

router.del('/:id', async (ctx) => {
    const userId = ctx.state.user._id;
    const product = await productStore.findOne({ _id: ctx.params.id });
    if (product && userId !== product.userId) {
        ctx.response.status = 403; //forbidden
    } else {
        await productStore.remove({ _id: ctx.params.id });
        ctx.response.status = 204; //no content
    }
});