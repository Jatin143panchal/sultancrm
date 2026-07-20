
// services/automation.ts
import { supabase } from '@/integrations/supabase/client';
import { projectService } from './projectService';

export const automationService = {
  // ── Auto-create project when lead converts ──
  async handleLeadConversion(leadId: string) {
    // Get lead data
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (!lead) return;

    // Create project
    const project = await projectService.createProject({
      lead_id: leadId,
      name: lead.company_name || lead.name,
      brand_name: lead.brand_name,
      project_type: lead.project_type,
      project_value: lead.estimated_budget,
      project_manager: lead.assigned_to,
    });

    // Create default communications
    await supabase.from('communications').insert({
      project_id: project.id,
      communication_type: 'comment',
      message: `Project auto-created from lead: ${lead.name}`,
      user_id: lead.assigned_to,
    });

    // Send notification to project manager
    await supabase.from('notifications').insert({
      user_id: lead.assigned_to,
      project_id: project.id,
      title: 'New Project Created',
      message: `Project "${project.name}" has been auto-created from a converted lead.`,
      type: 'client_update_required',
    });

    return project;
  },

  // ── Auto-update completion percentage ──
  async updateProjectProgress(projectId: string) {
    const tasks = await projectService.getProjectTasks(projectId);
    const stages = await projectService.getProjectStages(projectId);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const totalStages = stages.length;
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const stageProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

    // Weighted average: 60% tasks, 40% stages
    const overallProgress = (taskProgress * 0.6) + (stageProgress * 0.4);

    await supabase
      .from('projects')
      .update({ completion_percentage: Math.round(overallProgress) })
      .eq('id', projectId);
  },

  // ── Auto-update current stage ──
  async updateCurrentStage(projectId: string) {
    const stages = await projectService.getProjectStages(projectId);
    
    // Find first stage that's not completed
    const currentStage = stages.find(s => s.status !== 'completed');
    
    if (currentStage) {
      const stageMap: Record<string, string> = {
        'Product Discovery & Validation': 'discovery',
        'Product Development & Sourcing': 'development',
        'Brand Creation': 'branding',
        'Launch Preparation': 'launch_prep',
        'Product Launch': 'launch',
        'Growth & Scale': 'growth',
      };

      await supabase
        .from('projects')
        .update({ current_stage: stageMap[currentStage.stage_name] || 'discovery' })
        .eq('id', projectId);
    }
  },

  // ── Check for overdue tasks and create notifications ──
  async checkOverdueTasks() {
    const today = new Date().toISOString().split('T')[0];

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, projects(name)')
      .lt('due_date', today)
      .neq('status', 'completed');

    if (!tasks) return;

    for (const task of tasks) {
      // Check if notification already exists
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('task_id', task.id)
        .eq('type', 'task_overdue')
        .single();

      if (!existing && task.assigned_to) {
        await supabase.from('notifications').insert({
          user_id: task.assigned_to,
          project_id: task.project_id,
          title: 'Task Overdue',
          message: `Task "${task.task_name}" in project "${task.projects?.name}" is overdue.`,
          type: 'task_overdue',
        });
      }
    }
  },

  // ── Check for upcoming launches ──
  async checkUpcomingLaunches() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .gte('expected_launch_date', today.toISOString().split('T')[0])
      .lte('expected_launch_date', nextWeek.toISOString().split('T')[0]);

    if (!projects) return;

    for (const project of projects) {
      // Send notification to project manager
      if (project.project_manager) {
        await supabase.from('notifications').insert({
          user_id: project.project_manager,
          project_id: project.id,
          title: 'Launch Date Approaching',
          message: `Project "${project.name}" launch date is approaching in ${Math.ceil(
            (new Date(project.expected_launch_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )} days.`,
          type: 'launch_approaching',
        });
      }
    }
  },

  // ── Check for pending agreements ──
  async checkPendingAgreements() {
    const { data: agreements } = await supabase
      .from('agreements')
      .select('*, projects(name)')
      .in('status', ['not_sent', 'draft', 'sent'])
      .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (!agreements) return;

    for (const agreement of agreements) {
      // Check if notification already exists
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('agreement_id', agreement.id)
        .eq('type', 'agreement_pending')
        .single();

      if (!existing) {
        // Find project manager
        const { data: project } = await supabase
          .from('projects')
          .select('project_manager')
          .eq('id', agreement.project_id)
          .single();

        if (project?.project_manager) {
          await supabase.from('notifications').insert({
            user_id: project.project_manager,
            project_id: agreement.project_id,
            title: 'Agreement Pending',
            message: `Agreement "${agreement.title}" for project "${agreement.projects?.name}" is pending.`,
            type: 'agreement_pending',
          });
        }
      }
    }
  },
};

//