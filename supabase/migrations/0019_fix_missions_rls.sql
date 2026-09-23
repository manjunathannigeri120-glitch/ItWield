-- Drop the restrictive policies
DROP POLICY IF EXISTS "business_missions_workspace_isolation" ON public.business_missions;
DROP POLICY IF EXISTS "mission_events_workspace_isolation" ON public.mission_events;

-- Recreate policies with owner fallback to match agents table behavior
CREATE POLICY "business_missions_workspace_isolation" ON public.business_missions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id AND (
        w.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.workspace_members wm 
          WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "mission_events_workspace_isolation" ON public.mission_events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workspaces w 
      WHERE w.id = workspace_id AND (
        w.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.workspace_members wm 
          WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
        )
      )
    )
  );
