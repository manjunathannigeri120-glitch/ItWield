import re

with open('backend/src/services/CEOService.ts', 'r') as f:
    c = f.read()

# exact text replacement
old_text = """                                 // To prevent MissionProgressService from instantly re-blocking due to the old task,
                                 // we mark the old CONNECTION_REQUIRED tasks for this mission as RETRIED (a safe ignored status).
                                 await supabase.from('tasks')
                                    .update({ status: 'CANCELLED', error: 'Recovered via connection readiness.' })
                                    .eq('mission_id', mission.id)
                                    .in('status', ['BLOCKED', 'FAILED']);
                                    """
new_text = ""
c = c.replace(old_text, new_text)

with open('backend/src/services/CEOService.ts', 'w') as f:
    f.write(c)

print("Removed tasks update explicitly")
