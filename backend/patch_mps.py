import re

with open('backend/src/services/MissionProgressService.ts', 'r') as f:
    c = f.read()

pattern = r"\} else if \(mostRecentErrorTask && mostRecentErrorTask\.error\) \{"
replacement = r"""} else if (work.running === 0 && work.pending === 0 && mostRecentErrorTask && mostRecentErrorTask.error) {"""

c = re.sub(pattern, replacement, c)

with open('backend/src/services/MissionProgressService.ts', 'w') as f:
    f.write(c)

print("Patched MissionProgressService.ts")
