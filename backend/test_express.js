const express = require('express');

const app = express();
const indexRouter = express.Router();

const missionsRouter = express.Router({ mergeParams: true });
missionsRouter.get('/', (req, res) => {
  res.json({ workspaceId: req.params.workspaceId });
});

indexRouter.use('/workspaces/:workspaceId/missions', missionsRouter);
app.use('/api', indexRouter);

const request = require('supertest');

request(app)
  .get('/api/workspaces/123/missions')
  .end((err, res) => {
    console.log(res.body);
    process.exit();
  });
