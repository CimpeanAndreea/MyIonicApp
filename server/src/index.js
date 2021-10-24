const Koa = require('koa');
const app = new Koa();
const server = require('http').createServer(app.callback());
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const Router = require('koa-router');
const cors = require('koa-cors');
const bodyparser = require('koa-bodyparser');

app.use(bodyparser());
app.use(cors());
app.use(async (ctx, next) => { //middleware functions
  const start = new Date();
  await next(); // wait for the execution of the next functions
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`);
});

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  await next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.body = { issue: [{ error: err.message || 'Unexpected error' }] };
    ctx.response.status = 500;
  }
});

class Product {
  constructor({ id, name, price, dateAdded, version, quantity }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.dateAdded = dateAdded;
    this.quantity = quantity;
    this.version = version;
  }
}

const products = [];
for (let i = 0; i < 3; i++) {
  products.push(new Product({ id: `${i}`, name: `product ${i}`, price: 100, dateAdded: new Date(Date.now() + i), version: 1, quantity: 10}));
}

let lastUpdated = products[products.length - 1].dateAdded;
let lastId = products[products.length - 1].id;

const broadcast = data => // web socket server notification
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });

const router = new Router();

router.get('/product', ctx => {
  const ifModifiedSince = ctx.request.get('If-Modif ied-Since');
  if (ifModifiedSince && new Date(ifModifiedSince).getTime() >= lastUpdated.getTime() - lastUpdated.getMilliseconds()) {
    ctx.response.status = 304; // NOT MODIFIED
    return;
  }
  ctx.response.set('Last-Modified', lastUpdated.toUTCString());
  ctx.response.body = products;
  ctx.response.status = 200;
});


router.get('/product/:id', async (ctx) => {
  const productId = ctx.request.params.id;
  const product = products.find(product => productId === product.id);
  if (product) {
    ctx.response.body = product;
    ctx.response.status = 200; // ok
  } else {
    ctx.response.body = { issue: [{ warning: `product with id ${productId} not found` }] };
    ctx.response.status = 404; // NOT FOUND (if you know the resource was deleted, then return 410 GONE)
  }
});


const createProduct = async (ctx) => {
  const product = ctx.request.body;
  if (!product.name) { // validation
    ctx.response.body = { issue: [{ error: 'Name is missing' }] };
    ctx.response.status = 400; //  BAD REQUEST
    return;
  }
  product.id = `${parseInt(lastId) + 1}`;
  lastId = product.id;
  product.dateAdded = new Date();
  product.version = 1;
  products.push(product);
  ctx.response.body = product;
  ctx.response.status = 201; // CREATED
  broadcast({ event: 'created', payload: { product } }); // web socket server notification
};

router.post('/product', async (ctx) => {
  await createProduct(ctx);
});

router.put('/product/:id', async (ctx) => {
  const id = ctx.params.id;
  const product = ctx.request.body;
  product.dateAdded = new Date();
  const productId = product.id;
  if (productId && id !== product.id) {
    ctx.response.body = { issue: [{ error: `Param id and body id should be the same` }] };
    ctx.response.status = 400; // BAD REQUEST
    return;
  }
  if (!productId) {
    await createProduct(ctx);
    return;
  }
  const index = products.findIndex(product => product.id === id);
  if (index === -1) {
    ctx.response.body = { issue: [{ error: `product with id ${id} not found` }] };
    ctx.response.status = 400; // BAD REQUEST
    return;
  }
  const productVersion = parseInt(ctx.request.get('ETag')) || product.version;
  if (productVersion < products[index].version) {
    ctx.response.body = { issue: [{ error: `Version conflict` }] };
    ctx.response.status = 409; // CONFLICT
    return;
  }
  product.version++;
  products[index] = product;
  lastUpdated = new Date();
  ctx.response.body = product;
  ctx.response.status = 200; // OK
  broadcast({ event: 'updated', payload: { product } });
});

router.del('/product/:id', ctx => {
  const id = ctx.params.id;
  const index = products.findIndex(product => id === product.id);
  if (index !== -1) {
    const product = products[index];
    products.splice(index, 1);
    lastUpdated = new Date();
    broadcast({ event: 'deleted', payload: { product } });
  }
  ctx.response.status = 204; // no content
});

/*setInterval(() => {
  lastUpdated = new Date();
  lastId = `${parseInt(lastId) + 1}`;
  const product = new Product({ id: lastId, name: `product ${lastId}`, price: 1, dateAdded: lastUpdated, version: 1, quantity: 10 });
  products.push(product);
  console.log(`
   ${product.name}`);
  broadcast({ event: 'created', payload: { product } });
}, 100);*/

app.use(router.routes());
app.use(router.allowedMethods());

server.listen(3000);
