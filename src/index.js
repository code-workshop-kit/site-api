require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const passport = require('koa-passport');
const webhookDeployRoutes = require('./routes/webhook-deploy.js');
const subscribeUpdateRoutes = require('./routes/subscribe-updates.js');
const userRoutes = require('./routes/users.js');

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.keys = [process.env.CWK_APP_KEY];
app.use(session(app));

// authentication
require('./auth');
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser());
app.use(webhookDeployRoutes.routes());
app.use(subscribeUpdateRoutes.routes());
app.use(userRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
