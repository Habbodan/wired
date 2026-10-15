import { Router } from 'express';
import { z } from 'zod';
import { workspaceUpsertSchema } from '../../shared/wired.js';
import { currentUser } from '../auth/sessions.js';
import { HttpError } from '../http/errors.js';
import type { WorkspaceService } from './service.js';

const idSchema = z.uuid();

export function workspacesRouter(workspaces: WorkspaceService): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json({ workspaces: await workspaces.list(currentUser(req).id) });
  });

  router.get('/:id', async (req, res) => {
    const workspace = await workspaces.get(currentUser(req).id, idSchema.parse(req.params.id));
    if (!workspace) throw new HttpError(404, 'workspace_not_found');
    res.json({ workspace });
  });

  router.put('/:id', async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const input = workspaceUpsertSchema.parse(req.body);
    res.json({ workspace: await workspaces.upsert(currentUser(req).id, id, input) });
  });

  router.delete('/:id', async (req, res) => {
    const removed = await workspaces.remove(currentUser(req).id, idSchema.parse(req.params.id));
    if (!removed) throw new HttpError(404, 'workspace_not_found');
    res.status(204).end();
  });

  return router;
}
