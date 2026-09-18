import { Action, ActionContext } from './Action';
import { getSecureConnection } from './integrationUtils';

export class GoogleSheetsUpdateRowAction implements Action {
  id = 'google_sheets_update_row';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { connectionId, spreadsheetId, sheetName, rowNumber, values } = config;

    if (!connectionId || !spreadsheetId || !sheetName || !rowNumber || !values || !Array.isArray(values)) {
      throw new Error('INVALID_INTEGRATION_INPUT: Missing connectionId, spreadsheetId, sheetName, rowNumber, or valid values array');
    }

    const credentials = await getSecureConnection(context, connectionId, 'google_sheets');
    
    if (credentials.mock) {
       return { success: true, mock: true, rowNumber: rowNumber };
    }

    const token = credentials.access_token;
    if (!token) {
        throw new Error('CONNECTION_UNAUTHORIZED: Missing Google access token');
    }

    // Row number is 1-indexed. Update the specific row
    const range = encodeURIComponent(`${sheetName}!A${rowNumber}`);
    
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            values: [values]
        })
    });

    if (response.status === 429) {
        throw new Error('PROVIDER_RATE_LIMITED: Google Sheets rate limit exceeded');
    }
    
    if (response.status === 401) {
        throw new Error('CONNECTION_EXPIRED: Google access token expired or invalid');
    }

    if (!response.ok) {
        throw new Error(`PROVIDER_UNAVAILABLE: Google Sheets returned ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
        success: true,
        updatedCells: data.updatedCells || 0
    };
  }
}
