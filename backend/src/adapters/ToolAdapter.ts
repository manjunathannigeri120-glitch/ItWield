export interface ToolEvidence {
    externalId?: string;
    url?: string;
    timestamp: string;
    summary: string;
    rawResponse?: any;
}

export interface ToolExecutionResult {
    success: boolean;
    evidence?: ToolEvidence;
    errorCode?: string;
    errorMessage?: string;
}

export interface ToolAdapter {
    provider: string;
    systemType: string;
    
    // Test if the connection is valid and can reach the provider
    testConnection(credentials: any): Promise<{ status: 'CONNECTED' | 'AUTH_REQUIRED' | 'DEGRADED' | 'ERROR'; message?: string }>;
    
    // Return capabilities that are currently authorized/available for this connection
    getCapabilities(credentials: any): Promise<string[]>;
    
    // Execute an action
    execute(capability: string, input: any, credentials: any): Promise<ToolExecutionResult>;
    
    // Verify an action occurred
    verify(capability: string, executionResult: ToolExecutionResult, credentials: any): Promise<boolean>;
    
    // Disconnect/Revoke
    disconnect(credentials: any): Promise<void>;
}
