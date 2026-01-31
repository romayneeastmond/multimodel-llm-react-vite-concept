import { useState } from 'react';
import { Workflow, WorkflowStep, WorkflowStepType, MultiModel } from '../types/index';
import { getCosmosConfig, saveWorkflow, deleteWorkflow } from '../services/cosmosService';

interface UseWorkflowBuilderProps {
	workflows: Workflow[];
	setWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
	currentUser: string | undefined;
}

export const useWorkflowBuilder = ({ workflows, setWorkflows, currentUser }: UseWorkflowBuilderProps) => {
	const [isWorkflowBuilderOpen, setIsWorkflowBuilderOpen] = useState(false);
	const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
	const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
	const [workflowForm, setWorkflowForm] = useState<Partial<Workflow>>({ name: '', description: '', steps: [], allowedGroups: [] });
	const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

	const addWorkflowStep = (type: WorkflowStepType) => {
		const newStep: WorkflowStep = {
			id: Math.random().toString(36).substr(2, 9),
			type,
			model: type === 'prompt' ? MultiModel.FLASH_3 : undefined,
			prompt: type === 'prompt' ? '' : undefined,
			exportFormat: type === 'export' ? 'text' : undefined,
			toolIds: type === 'mcp_tool' ? [] : undefined,
			personaId: type === 'persona' ? undefined : undefined,
			url: type === 'web_scraper' ? '' : undefined,
			includeMeta: type === 'web_scraper' ? false : undefined
		};
		setWorkflowForm(prev => ({ ...prev, steps: [...(prev.steps || []), newStep] }));
	};

	const updateWorkflowStep = (stepId: string, updates: Partial<WorkflowStep>) => {
		setWorkflowForm(prev => ({
			...prev,
			steps: (prev.steps || []).map(step => step.id === stepId ? { ...step, ...updates } : step)
		}));
	};

	const removeWorkflowStep = (stepId: string) => {
		setWorkflowForm(prev => ({
			...prev,
			steps: (prev.steps || []).filter(step => step.id !== stepId)
		}));
	};

	const moveWorkflowStep = (index: number, direction: 'up' | 'down') => {
		setWorkflowForm(prev => {
			const newSteps = [...(prev.steps || [])];
			if (direction === 'up' && index > 0) {
				[newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
			} else if (direction === 'down' && index < newSteps.length - 1) {
				[newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
			}
			return { ...prev, steps: newSteps };
		});
	};

	const handleSaveWorkflow = (e: React.FormEvent) => {
		e.preventDefault();
		if (!workflowForm.name) return;

		let savedWorkflow: Workflow;

		if (editingWorkflowId) {
			const existingWorkflow = workflows.find(w => w.id === editingWorkflowId);
			if (existingWorkflow) {
				savedWorkflow = { ...existingWorkflow, ...workflowForm } as Workflow;
				setWorkflows(prev => prev.map(w => w.id === editingWorkflowId ? savedWorkflow : w));
			}
			setEditingWorkflowId(null);
		} else {
			savedWorkflow = {
				id: Date.now().toString(),
				name: workflowForm.name!,
				description: workflowForm.description || '',
				steps: workflowForm.steps || [],
				isSystem: currentUser === 'System' ? true : undefined,
				allowedGroups: workflowForm.allowedGroups
			};
			setWorkflows(prev => [...prev, savedWorkflow]);
		}

		const config = getCosmosConfig();
		if (config.endpoint && config.key && currentUser) {
			// @ts-ignore
			saveWorkflow(config, savedWorkflow, currentUser).catch(console.error);
		}

		setWorkflowForm({ name: '', description: '', steps: [], allowedGroups: [] });
		setIsCreatingWorkflow(false);
	};

	const handleStartEditingWorkflow = (workflow: Workflow) => {
		setEditingWorkflowId(workflow.id);
		setWorkflowForm({
			name: workflow.name,
			description: workflow.description,
			steps: workflow.steps,
			allowedGroups: workflow.allowedGroups
		});
	};

	const confirmDeleteWorkflow = () => {
		if (workflowToDelete) {
			const config = getCosmosConfig();
			if (config.endpoint && config.key && currentUser) {
				deleteWorkflow(config, workflowToDelete, currentUser).catch(console.error);
			}
			setWorkflows(prev => prev.filter(w => w.id !== workflowToDelete));
			setWorkflowToDelete(null);
		}
	};

	return {
		isWorkflowBuilderOpen,
		setIsWorkflowBuilderOpen,
		editingWorkflowId,
		setEditingWorkflowId,
		isCreatingWorkflow,
		setIsCreatingWorkflow,
		workflowForm,
		setWorkflowForm,
		workflowToDelete,
		setWorkflowToDelete,
		addWorkflowStep,
		updateWorkflowStep,
		removeWorkflowStep,
		moveWorkflowStep,

		handleSaveWorkflow,
		handleStartEditingWorkflow,
		confirmDeleteWorkflow
	};
};
