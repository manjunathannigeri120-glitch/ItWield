import re

with open('frontend/src/pages/MissionDetail.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Add why is this mission running
if "Why is this mission running?" not in c:
    c = c.replace(
        '<h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Objective</h2>',
        """<h2 className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-2">Why is this mission running?</h2>
          <div className="bg-indigo-50 text-indigo-900 p-4 rounded-lg border border-indigo-100 mb-6 text-sm">
            <span className="font-bold block mb-1">Business Purpose:</span>
            {mission.business_goal?.objective || 'This mission drives operational baseline requirements.'}
          </div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Execution Objective</h2>"""
    )

with open('frontend/src/pages/MissionDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
