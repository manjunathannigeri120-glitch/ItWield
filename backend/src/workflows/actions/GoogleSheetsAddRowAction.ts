import { Action, ActionContext } from './Action';
import { getSecureConnection } from './integrationUtils';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export class GoogleSheetsAddRowAction implements Action {
  id = 'google_sheets_add_row';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { connectionId, spreadsheetId, sheetName, values } = config;

    if (!connectionId || !spreadsheetId || !sheetName || !values || !Array.isArray(values)) {
      throw new Error('INVALID_INTEGRATION_INPUT: Missing connectionId, spreadsheetId, sheetName, or valid values array');
    }

    const credentials = await getSecureConnection(context, connectionId, 'google_sheets');
    
    if (credentials.mock) {
       return { success: true, mock: true, rowNumber: 2 };
    }

    const token = credentials.access_token;
    if (!token) {
        throw new Error('CONNECTION_UNAUTHORIZED: Missing Google access token');
    }

    const range = encodeURIComponent(sheetName);
    
    // Add row to Google Sheets
    const response = await fetchWithTimeout(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
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
    
    // Attempt to parse the updated row from "Updates" object
    let rowNumber = null;
    if (data.updates && data.updates.updatedRange) {
        const match = data.updates.updatedRange.match(/\d+$/);
        if (match) {
            rowNumber = parseInt(match[0], 10);
        }
    }

    return {
        success: true,
        rowNumber: rowNumber
    };
  }
}
