-- 0037_fix_opportunities_rls.sql

DROP POLICY IF EXISTS "Users can view opportunities in their workspaces" ON public.opportunities;
DROP POLICY IF EXISTS "Users can insert opportunities in their workspaces" ON public.opportunities;
DROP POLICY IF EXISTS "Users can update opportunities in their workspaces" ON public.opportunities;
DROP POLICY IF EXISTS "Users can delete opportunities in their workspaces" ON public.opportunities;

CREATE POLICY "opportunities_select" ON public.opportunities 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = opportunities.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = opportunities.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "opportunities_insert" ON public.opportunities 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = opportunities.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = opportunities.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "opportunities_update" ON public.opportunities 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = opportunities.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = opportunities.workspace_id AND wm.user_id = auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = opportunities.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = opportunities.workspace_id AND wm.user_id = auth.uid())))
);
