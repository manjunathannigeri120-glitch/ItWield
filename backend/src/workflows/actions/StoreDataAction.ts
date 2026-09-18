import { Action, ActionContext } from './Action';

export class StoreDataAction implements Action {
  id = 'action_store_data';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { collection, data } = config;
    if (!collection) throw new Error('Missing required field (collection)');
    if (!data) throw new Error('Missing required field (data)');
    if (!context.supabase) throw new Error('StoreDataAction requires a database connection');

    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (err) {
        // Leave as string if it's not valid JSON
      }
    }

    const { data: inserted, error } = await context.supabase
      .from('workspace_data')
      .insert({
        workspace_id: context.workspaceId,
        collection_key: collection,
        data: parsedData
      })
      .select('id, collection_key')
      .single();

    if (error) {
      return { success: false, error: { code: 'STORE_ERROR', message: error.message } };
    }

    return { 
      success: true, 
      stored: true, 
      recordId: inserted.id, 
      collection: inserted.collection_key 
    };
  }
}
