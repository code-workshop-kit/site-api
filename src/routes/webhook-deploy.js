const Router = require('koa-router');
const { validateWebhookSignature } = require('../deployment/validate-webhook-signature.js');
const { deployCWK, postDeploy } = require('../deployment/deployCWK.js');

const router = new Router();
// For development/test, put /api prefix.
// For production, we use a reverse proxy for all `/api` requests --> `/`
const routePrefix = process.env.NODE_ENV === 'production' ? '' : `/api`;
const validRepositories = ['code-workshop-kit/site', 'code-workshop-kit/site-api'];

router.post(`${routePrefix}/webhook-deploy`, async (ctx) => {
  ctx.status = 401;
  const payload = ctx.request.body;

  const validated = validateWebhookSignature(
    JSON.stringify(payload),
    process.env.WEBHOOK_DEPLOY_KEY,
    ctx.request.headers['x-hub-signature-256'],
  );

  if (!validated) {
    ctx.body = {
      error: 'Unauthorized: deployment webhook payload does not contain a valid signature.',
    };
    console.warn(
      'Deployment webhook payload does not contain a valid signature.',
      payload,
      ctx.request.headers['x-hub-signature-256'],
    );
    return;
  }

  if (!payload.repository || !validRepositories.includes(payload.repository.full_name)) {
    ctx.body = {
      error: 'Unauthorized: webhook does not originate from a valid repository.',
    };
    console.warn('Deployment webhook payload does not originate from a valid repository.', payload);
    return;
  }

  if (payload.ref !== 'refs/heads/main') {
    ctx.status = 403;
    ctx.body = {
      error: 'Forbidden: target branch was not the configured branch, so not deploying.',
    };
    return;
  }

  console.log(`Deploying ${payload.repository.full_name}...`);
  switch (payload.repository.full_name) {
    case 'code-workshop-kit/site':
      await deployCWK('html', payload.repository.full_name);
      break;
    case 'code-workshop-kit/site-api':
      await deployCWK('api', payload.repository.full_name);
      break;
  }
  console.log('Deployment done!');

  ctx.status = 201;
  ctx.body = {
    status: 'Successfully deployed.',
  };

  if (payload.repository.full_name === 'code-workshop-kit/site-api') {
    console.log('Post deployment running...');
    postDeploy('api', 'npm i && pm2 restart "site api"').then(() => {
      console.log('Post deployment done!');
    });
  }
});

module.exports = router;
