import { Action, ActionContext } from './Action';
import { getSecureConnection } from './integrationUtils';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

export class GoogleSheetsFindRowAction implements Action {
  id = 'google_sheets_find_row';

  async execute(config: any, context: ActionContext): Promise<any> {
    const { connectionId, spreadsheetId, sheetName, column, value } = config;

    if (!connectionId || !spreadsheetId || !sheetName || column == null || value == null) {
      throw new Error('INVALID_INTEGRATION_INPUT: Missing connectionId, spreadsheetId, sheetName, column, or value');
    }

    const credentials = await getSecureConnection(context, connectionId, 'google_sheets');
    
    if (credentials.mock) {
       return { found: true, mock: true, rowNumber: 2, values: [value, 'mock_data'] };
    }

    const token = credentials.access_token;
    if (!token) {
        throw new Error('CONNECTION_UNAUTHORIZED: Missing Google access token');
    }

    const range = encodeURIComponent(sheetName);
    
    const response = await fetchWithTimeout(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
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
    
    const rows: any[][] = data.values || [];
    
    // We treat column as a 0-indexed integer or standard A, B, C string.
    // If it's an integer index, use it. If it's a string, we might map it, but for simplicity we assume index or convert.
    let colIndex = 0;
    if (typeof column === 'number') {
        colIndex = column;
    } else if (typeof column === 'string') {
        // Very basic conversion: A=0, B=1...
        if (/^[A-Z]$/.test(column)) {
            colIndex = column.charCodeAt(0) - 65;
        } else {
            colIndex = parseInt(column, 10);
        }
    }

    if (isNaN(colIndex) || colIndex < 0) {
        throw new Error('INVALID_INTEGRATION_INPUT: Invalid column identifier');
    }

    // Search
    const searchValue = String(value).toLowerCase();
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row[colIndex] && String(row[colIndex]).toLowerCase() === searchValue) {
            return {
                found: true,
                rowNumber: i + 1, // Sheets uses 1-based indexing
                values: row
            };
        }
    }

    return { found: false };
  }
}
