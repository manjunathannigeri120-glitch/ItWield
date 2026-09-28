import { describe, it, expect, beforeEach } from 'vitest';
import { ControlLayerService, ActionRequest } from '../services/ControlLayerService';

describe('ControlLayerService', () => {
    
    it('classifies risk levels correctly', () => {
        expect(ControlLayerService.classifyRisk('github', 'repository.write', 'PRODUCTION_DEPLOYMENT')).toBe('CRITICAL');
        expect(ControlLayerService.classifyRisk('crm', 'contacts.read', 'READ_CRM')).toBe('LOW');
        expect(ControlLayerService.classifyRisk('stripe', 'payment.create', 'CHANGE_PRICING')).toBe('CRITICAL');
        expect(ControlLayerService.classifyRisk('slack', 'message.send', 'EXTERNAL_COMMUNICATION')).toBe('HIGH');
    });

    it('resolves authority based on risk and actor', () => {
        const req: ActionRequest = {
            workspaceId: 'ws-123',
            actor: 'AI CTO',
            actorType: 'EXECUTIVE',
            system: 'github',
            capability: 'repository.read',
            action: 'GITHUB_LIST_REPOSITORIES',
            requestedAuthority: 'AUTONOMOUS'
        };
        // Low risk for executive
        expect(ControlLayerService.resolveAuthority(req, 'LOW')).toBe('AUTONOMOUS');
        
        // Critical risk for executive
        expect(ControlLayerService.resolveAuthority(req, 'CRITICAL')).toBe('APPROVAL_REQUIRED');

        // Worker low risk
        const workerReq = { ...req, actorType: 'WORKER' as any };
        expect(ControlLayerService.resolveAuthority(workerReq, 'LOW')).toBe('AUTONOMOUS');

        // Worker medium risk
        expect(ControlLayerService.resolveAuthority(workerReq, 'MEDIUM')).toBe('APPROVAL_REQUIRED');
    });

});

