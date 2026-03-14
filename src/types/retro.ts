import { Agent } from './agent';

export type RetroItemType = 'went_well' | 'improvements' | 'action_item';

export interface RetroItem {
  id: string;
  sprintId: string;
  type: RetroItemType;
  text: string;
  author: Agent;
  votes: number;
  resolved?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SprintRetro {
  id: string;
  sprintId: string;
  items: RetroItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRetroItemRequest {
  type: RetroItemType;
  text: string;
}

export interface UpdateRetroItemRequest {
  type?: RetroItemType;
  text?: string;
  resolved?: boolean;
}
