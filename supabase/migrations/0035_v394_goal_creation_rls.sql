-- Add missing INSERT policies for goal creation
CREATE POLICY "Users can create goals" ON public.business_goals FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create decision traces" ON public.decision_traces FOR INSERT WITH CHECK (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));
