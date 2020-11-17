const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const webhookDeployRoutes = require('./routes/webhook-deploy.js');
const subscribeUpdateRoutes = require('./routes/subscribe-updates.js');

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.use(bodyParser());
app.use(webhookDeployRoutes.routes());
app.use(subscribeUpdateRoutes.routes());
const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
