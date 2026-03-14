import { http, HttpResponse } from 'msw';
import { RetroItem, SprintRetro, CreateRetroItemRequest, UpdateRetroItemRequest } from '../../types/retro';
import { agents } from '../data/agents';

const retroData: Map<string, SprintRetro> = new Map();

// Initialize with mock data for each sprint
function getInitialRetroData(sprintId: string): SprintRetro {
  return {
    id: `retro-${sprintId}`,
    sprintId,
    items: [
      {
        id: 'retro-item-1',
        sprintId,
        type: 'went_well',
        text: 'Great collaboration between frontend and backend teams',
        author: agents[0],
        votes: 5,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'retro-item-2',
        sprintId,
        type: 'went_well',
        text: 'Completed all high-priority tasks ahead of schedule',
        author: agents[1],
        votes: 3,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'retro-item-3',
        sprintId,
        type: 'improvements',
        text: 'Need better communication on dependencies between tasks',
        author: agents[2],
        votes: 2,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'retro-item-4',
        sprintId,
        type: 'improvements',
        text: 'Code review turnaround time could be faster',
        author: agents[3],
        votes: 4,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'retro-item-5',
        sprintId,
        type: 'action_item',
        text: 'Implement automated testing for critical paths',
        author: agents[0],
        votes: 1,
        resolved: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const retroHandlers = [
  // GET /api/sprints/:sprintId/retro
  http.get('/api/sprints/:sprintId/retro', async ({ params }) => {
    const { sprintId } = params;
    await delay(Math.random() * 200 + 100); // 100-300ms delay

    if (!retroData.has(sprintId as string)) {
      retroData.set(sprintId as string, getInitialRetroData(sprintId as string));
    }

    return HttpResponse.json(retroData.get(sprintId as string), { status: 200 });
  }),

  // POST /api/sprints/:sprintId/retro/items
  http.post('/api/sprints/:sprintId/retro/items', async ({ params, request }) => {
    const { sprintId } = params;
    const body = (await request.json()) as CreateRetroItemRequest;
    await delay(Math.random() * 200 + 100); // 100-300ms delay

    if (!retroData.has(sprintId as string)) {
      retroData.set(sprintId as string, getInitialRetroData(sprintId as string));
    }

    const retro = retroData.get(sprintId as string)!;
    const newItem: RetroItem = {
      id: `retro-item-${Date.now()}`,
      sprintId: sprintId as string,
      type: body.type,
      text: body.text,
      author: agents[0],
      votes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    retro.items.push(newItem);
    retro.updatedAt = new Date().toISOString();

    return HttpResponse.json(newItem, { status: 201 });
  }),

  // PUT /api/sprints/:sprintId/retro/items/:id
  http.put('/api/sprints/:sprintId/retro/items/:id', async ({ params, request }) => {
    const { sprintId, id } = params;
    const body = (await request.json()) as UpdateRetroItemRequest;
    await delay(Math.random() * 200 + 100); // 100-300ms delay

    if (!retroData.has(sprintId as string)) {
      return HttpResponse.json({ error: 'Retro not found' }, { status: 404 });
    }

    const retro = retroData.get(sprintId as string)!;
    const item = retro.items.find(i => i.id === id);

    if (!item) {
      return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (body.type !== undefined) item.type = body.type;
    if (body.text !== undefined) item.text = body.text;
    if (body.resolved !== undefined) item.resolved = body.resolved;

    item.updatedAt = new Date().toISOString();
    retro.updatedAt = new Date().toISOString();

    return HttpResponse.json(item, { status: 200 });
  }),

  // DELETE /api/sprints/:sprintId/retro/items/:id
  http.delete('/api/sprints/:sprintId/retro/items/:id', async ({ params }) => {
    const { sprintId, id } = params;
    await delay(Math.random() * 200 + 100); // 100-300ms delay

    if (!retroData.has(sprintId as string)) {
      return HttpResponse.json({ error: 'Retro not found' }, { status: 404 });
    }

    const retro = retroData.get(sprintId as string)!;
    const itemIndex = retro.items.findIndex(i => i.id === id);

    if (itemIndex === -1) {
      return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    retro.items.splice(itemIndex, 1);
    retro.updatedAt = new Date().toISOString();

    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // PATCH /api/sprints/:sprintId/retro/items/:id/vote
  http.patch('/api/sprints/:sprintId/retro/items/:id/vote', async ({ params }) => {
    const { sprintId, id } = params;
    await delay(Math.random() * 200 + 100); // 100-300ms delay

    if (!retroData.has(sprintId as string)) {
      return HttpResponse.json({ error: 'Retro not found' }, { status: 404 });
    }

    const retro = retroData.get(sprintId as string)!;
    const item = retro.items.find(i => i.id === id);

    if (!item) {
      return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    item.votes += 1;
    item.updatedAt = new Date().toISOString();
    retro.updatedAt = new Date().toISOString();

    return HttpResponse.json(item, { status: 200 });
  }),
];
