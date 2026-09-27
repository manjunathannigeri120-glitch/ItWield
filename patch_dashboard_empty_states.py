import re

with open('frontend/src/pages/Dashboard.tsx', 'r') as f:
    c = f.read()

# 1. Add empty states for goals
if "Tell ItWield what you want your business to achieve to get started." not in c:
    c = c.replace(
        "{goals.map(g => (",
        """{goals.length === 0 && (
          <div className="bg-white p-8 text-center rounded-xl border-2 border-dashed border-slate-200 text-slate-500 mt-4">
            Tell ItWield what you want your business to achieve to get started.
          </div>
        )}
        {goals.map(g => ("""
    )

# 2. Add empty states for bottlenecks
if "No evidence-backed bottlenecks detected." not in c:
    c = c.replace(
        "{cooReview.bottlenecks?.length > 0 && (",
        """{cooReview.bottlenecks?.length === 0 && (
              <div className="mt-4 border-t border-indigo-100 pt-4">
                <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Active Business Bottlenecks</h3>
                <div className="text-sm text-slate-500 italic">No evidence-backed bottlenecks detected.</div>
              </div>
            )}
            {cooReview.bottlenecks?.length > 0 && ("""
    )

# 3. Add empty states for missions
if "Once you create a business goal, ItWield will build missions around it." not in c:
    c = c.replace(
        "{missions.length === 0 && <p className=\"text-gray-500\">No active missions.</p>}",
        "{missions.length === 0 && <p className=\"text-gray-500 p-4 bg-gray-50 rounded text-sm italic\">Once you create a business goal, ItWield will build missions around it.</p>}"
    )

with open('frontend/src/pages/Dashboard.tsx', 'w') as f:
    f.write(c)
