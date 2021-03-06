require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const passport = require('koa-passport');
const cors = require('@koa/cors');
const subscribeUpdateRoutes = require('./routes/subscribe-updates.js');
const userRoutes = require('./routes/users.js');
const authRoutes = require('./routes/auth.js');
const paymentRoutes = require('./routes/payments.js');

const app = new Koa();
const PORT = process.env.PORT || 3000;

app.keys = [process.env.APP_KEY];
app.use(
  session(
    {
      key: 'cwk.session',
      maxAge: 7 * 24 * 3600 * 1000, // 1 week
    },
    app,
  ),
);

// authentication
require('./auth');

app.use(passport.initialize());
app.use(passport.session());

// Allow cross origin requests during development
// (localhost:8000 request host --> localhost:3000 API)
// In production the origin is the same and apache reverse proxy takes care of proxying the port
// Need to check if credentials true is needed for prod, I *think* it should be fine
// without because the origin should be the same?
if (process.env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: 'http://localhost:8000',
      credentials: true,
    }),
  );
}
app.use(bodyParser());
app.use(subscribeUpdateRoutes.routes());
app.use(userRoutes.routes());
app.use(authRoutes.routes());
app.use(paymentRoutes.routes());

const server = app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});

module.exports = server;
