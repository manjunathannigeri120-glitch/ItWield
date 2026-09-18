import { Tool } from './Tool';
import { WebSearchTool } from './webSearch';
import { KnowledgeSearchTool } from './knowledgeSearch';
import { HttpRequestTool } from './httpRequest';

const tools: Record<string, Tool> = {
  web_search: new WebSearchTool(),
  knowledge_search: new KnowledgeSearchTool(),
  http_request: new HttpRequestTool()
};

export function getTool(name: string): Tool | undefined {
  return tools[name];
}

export function getAllTools(): Tool[] {
  return Object.values(tools);
}
