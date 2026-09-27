import re

with open('frontend/src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''      {/* BUSINESS GOALS */}
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Business Outcomes</h2>
        
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border-2 border-slate-300 rounded-lg p-3 text-lg focus:border-indigo-500 outline-none" 
            placeholder="Tell ItWield what you want your business to achieve (e.g. 'Get me 20 customers')" 
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateGoal()}
          />
          <Button className="h-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-lg text-white" onClick={handleCreateGoal} disabled={goalSubmitting}>
            {goalSubmitting ? 'Planning...' : 'Command'}
          </Button>
        </div>'''

new_block = '''      {/* BUSINESS GOALS */}
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Business Outcomes</h2>
        
        {!intakeMode ? (
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 border-2 border-slate-300 rounded-lg p-3 text-lg focus:border-indigo-500 outline-none" 
              placeholder="Tell ItWield what you want your business to achieve (e.g. 'Get me 20 customers')" 
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateGoal()}
            />
            <Button className="h-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-lg text-white" onClick={handleCreateGoal} disabled={goalSubmitting}>
              {goalSubmitting ? 'Planning...' : 'Command'}
            </Button>
          </div>
        ) : (
          <div className="bg-white p-6 border-2 border-indigo-100 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">I UNDERSTOOD YOUR GOAL</h3>
            <p className="text-gray-700 font-medium mb-6 text-lg">"{goalInput}"</p>
            
            <div className="bg-indigo-50 text-indigo-900 p-4 rounded-md mb-6">
              <p className="font-semibold">{intakeMessage || 'Before I operate, I need:'}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Business website</label>
              <input 
                type="text" 
                className="w-full border-2 border-slate-300 rounded p-3 text-lg focus:border-indigo-500 outline-none" 
                placeholder="https://example.com" 
                value={websiteInput}
                onChange={e => setWebsiteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateGoal()}
              />
            </div>

            <div className="flex space-x-3">
              <Button onClick={handleCreateGoal} disabled={goalSubmitting || !websiteInput.trim()} className="bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-2 h-auto text-lg">
                {goalSubmitting ? 'Processing...' : 'Continue'}
              </Button>
              <Button onClick={() => setIntakeMode(false)} variant="outline" className="px-8 py-2 h-auto text-lg">
                Cancel
              </Button>
            </div>
          </div>
        )}'''

content = content.replace(old_block, new_block)

with open('frontend/src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
