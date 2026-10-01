const fs = require('fs');
let file = 'frontend/src/pages/CRM.tsx';
let content = fs.readFileSync(file, 'utf8');

let fixDraft = `              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Drafts */}
                {selectedOpp.outreach_draft && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Proposed Outreach Draft
                    </h3>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                      <div className="text-sm font-semibold text-gray-900 mb-1">To: {selectedOpp.outreach_draft.recipient || 'TBD'}</div>
                      <div className="text-sm font-semibold text-gray-900 mb-3">Subject: {selectedOpp.outreach_draft.subject}</div>
                      <div className="text-sm text-gray-800 whitespace-pre-wrap font-serif bg-white p-4 rounded border border-blue-50">
                        {selectedOpp.outreach_draft.body}
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => window.location.href='/approvals'}>
                          Review in Approvals
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Qualification */}`;

content = content.replace(/<div className="flex-1 overflow-y-auto p-6 space-y-8">\s*\{\/\* Qualification \*\//, fixDraft);

fs.writeFileSync(file, content);
