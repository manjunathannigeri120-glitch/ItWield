import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface GeneratedWorkflow {
  name: string;
  description: string;
  startNode: string;
  nodes: any[];
}

interface AIGeneratorProps {
  workspaceId: string;
  /** Called when the user clicks "Load into Editor" — passes the generated workflow definition */
  onLoad: (workflow: GeneratedWorkflow) => void;
  onCancel: () => void;
}

export function AIWorkflowGenerator({ workspaceId, onLoad, onCancel }: AIGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Results
  const [status, setStatus] = useState<'idle' | 'ready' | 'needs_input'>('idle');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [explanation, setExplanation] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');
    setStatus('idle');
    setGeneratedWorkflow(null);
    setWarnings([]);
    setQuestions([]);

    try {
      const res = await api.post('/workflows/generate', {
        prompt: prompt.trim(),
        workspaceId
      });

      const data = res.data;

      if (data.status === 'ready') {
        setGeneratedWorkflow(data.workflow);
        setExplanation(data.explanation || '');
        setWarnings(data.warnings || []);
        setStatus('ready');
      } else if (data.status === 'needs_input') {
        setQuestions(data.questions || []);
        setStatus('needs_input');
      } else {
        setError(data.error || data.message || 'Unknown error from generator');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate();
    }
  };

  const handleRegenerate = () => {
    setStatus('idle');
    setGeneratedWorkflow(null);
    setWarnings([]);
    setQuestions([]);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Generate Workflow with AI</h2>
          <p className="text-sm text-muted-foreground">Describe your automation in plain language</p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">What should this workflow do?</label>
        <textarea
          className="w-full min-h-[120px] px-3 py-2 text-sm border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={`Examples:\n• "When I receive a webhook with a new customer, check Google Sheets if the email exists. If not, add them and send a Slack message."\n• "Every Monday at 9am UTC, send a Slack reminder to #general."\n• "When the webhook fires, transform the name to uppercase and store the data."`}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={2000}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Ctrl+Enter to generate</span>
          <span>{prompt.length}/2000</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Needs Input */}
      {status === 'needs_input' && questions.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md space-y-3">
          <p className="text-sm font-medium text-amber-800">More information needed:</p>
          <ul className="space-y-1">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-2 text-sm text-amber-700">
                <span className="font-medium">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-amber-600">Add the answers to your description above and regenerate.</p>
        </div>
      )}

      {/* Ready — Preview */}
      {status === 'ready' && generatedWorkflow && (
        <div className="border rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-b border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Workflow Generated</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Name + Description */}
            <div>
              <p className="font-semibold text-base">{generatedWorkflow.name}</p>
              {generatedWorkflow.description && (
                <p className="text-sm text-muted-foreground mt-1">{generatedWorkflow.description}</p>
              )}
            </div>

            {/* Explanation */}
            {explanation && (
              <div className="p-3 bg-muted/30 rounded text-sm">
                <span className="font-medium">AI explanation: </span>{explanation}
              </div>
            )}

            {/* Nodes list */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Steps ({generatedWorkflow.nodes?.length ?? 0})</p>
              <div className="space-y-1">
                {(generatedWorkflow.nodes ?? []).map((n: any) => (
                  <div key={n.id} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="font-mono text-xs text-muted-foreground">{n.type}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="truncate">{n.id.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded space-y-1">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700">⚠ {w}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>

        <div className="flex gap-2">
          {status === 'ready' && (
            <Button variant="outline" onClick={handleRegenerate} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
          )}

          {status !== 'ready' ? (
            <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={() => onLoad(generatedWorkflow!)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Load into Editor
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
