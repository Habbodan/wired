import path from 'node:path';
import express, { Router } from 'express';

export function serveClient(clientDir: string): Router {
  const router = Router();
  const indexFile = path.join(clientDir, 'index.html');

  router.use(
    '/assets',
    express.static(path.join(clientDir, 'assets'), { immutable: true, maxAge: '1y', index: false }),
  );
  router.use(express.static(clientDir, { index: false, maxAge: '1h' }));

  router.get(/^\/(?!api\/|auth\/).*/, (req, res, next) => {
    if (!req.accepts('html')) return next();
    res.set('Cache-Control', 'no-cache');
    res.sendFile(indexFile);
  });

  return router;
}
