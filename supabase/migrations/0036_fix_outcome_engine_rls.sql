-- 0036_fix_outcome_engine_rls.sql

-- 1. business_goals (SELECT, INSERT)
DROP POLICY IF EXISTS "View goals" ON public.business_goals;
DROP POLICY IF EXISTS "Users can create goals" ON public.business_goals;

CREATE POLICY "business_goals_select" ON public.business_goals 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = business_goals.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = business_goals.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "business_goals_insert" ON public.business_goals 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = business_goals.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = business_goals.workspace_id AND wm.user_id = auth.uid())))
);

-- 2. business_bottlenecks (SELECT)
DROP POLICY IF EXISTS "View bottlenecks" ON public.business_bottlenecks;

CREATE POLICY "business_bottlenecks_select" ON public.business_bottlenecks 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = business_bottlenecks.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = business_bottlenecks.workspace_id AND wm.user_id = auth.uid())))
);

-- 3. business_data_registry (SELECT)
DROP POLICY IF EXISTS "View registry" ON public.business_data_registry;

CREATE POLICY "business_data_registry_select" ON public.business_data_registry 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = business_data_registry.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = business_data_registry.workspace_id AND wm.user_id = auth.uid())))
);

-- 4. decision_traces (SELECT, INSERT)
DROP POLICY IF EXISTS "View traces" ON public.decision_traces;
DROP POLICY IF EXISTS "Users can create decision traces" ON public.decision_traces;

CREATE POLICY "decision_traces_select" ON public.decision_traces 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = decision_traces.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = decision_traces.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "decision_traces_insert" ON public.decision_traces 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = decision_traces.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = decision_traces.workspace_id AND wm.user_id = auth.uid())))
);

-- 5. company_memory (Owner: SELECT/UPDATE. Member: SELECT)
DROP POLICY IF EXISTS "Users can view memory in their workspaces" ON public.company_memory;
DROP POLICY IF EXISTS "Users can update memory in their workspaces" ON public.company_memory;
-- Note: "Service role can manage all company memory" from 0016 is intentionally preserved by not dropping it.

CREATE POLICY "company_memory_select" ON public.company_memory 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = company_memory.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = company_memory.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "company_memory_update" ON public.company_memory 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = company_memory.workspace_id AND w.owner_id = auth.uid())
) 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = company_memory.workspace_id AND w.owner_id = auth.uid())
);

-- 6. mission_plans (SELECT, INSERT, UPDATE)
DROP POLICY IF EXISTS "mission_plans_isolation" ON public.mission_plans;

CREATE POLICY "mission_plans_select" ON public.mission_plans 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plans.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plans.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "mission_plans_insert" ON public.mission_plans 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plans.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plans.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "mission_plans_update" ON public.mission_plans 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plans.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plans.workspace_id AND wm.user_id = auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plans.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plans.workspace_id AND wm.user_id = auth.uid())))
);

-- 7. mission_plan_steps (SELECT, INSERT, UPDATE)
DROP POLICY IF EXISTS "mission_plan_steps_isolation" ON public.mission_plan_steps;

CREATE POLICY "mission_plan_steps_select" ON public.mission_plan_steps 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plan_steps.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plan_steps.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "mission_plan_steps_insert" ON public.mission_plan_steps 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plan_steps.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plan_steps.workspace_id AND wm.user_id = auth.uid())))
);

CREATE POLICY "mission_plan_steps_update" ON public.mission_plan_steps 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plan_steps.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plan_steps.workspace_id AND wm.user_id = auth.uid())))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = mission_plan_steps.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = mission_plan_steps.workspace_id AND wm.user_id = auth.uid())))
);

-- 8. Billing Tables (SELECT)
DROP POLICY IF EXISTS "Users can view subscriptions in their workspaces" ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = subscriptions.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = subscriptions.workspace_id AND wm.user_id = auth.uid())))
);

DROP POLICY IF EXISTS "Users can view usage in their workspaces" ON public.usage_records;
CREATE POLICY "usage_records_select" ON public.usage_records 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = usage_records.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = usage_records.workspace_id AND wm.user_id = auth.uid())))
);

DROP POLICY IF EXISTS "Users can view billing events in their workspaces" ON public.billing_events;
CREATE POLICY "billing_events_select" ON public.billing_events 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = billing_events.workspace_id AND (w.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = billing_events.workspace_id AND wm.user_id = auth.uid())))
);
