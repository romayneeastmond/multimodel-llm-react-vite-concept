import React from 'react';
import { Pin, X } from 'lucide-react';
import { A2UIProvider } from './a2ui/A2UIContext';
import A2UIRenderer from './a2ui/A2UIRenderer';

interface PinnedForm {
	blueprint: any;
	toolName: string;
	formId: string;
}

interface PinnedFormsPanelProps {
	pinnedForms: PinnedForm[];
	activePinnedFormIndex: number;
	setActivePinnedFormIndex: (index: number) => void;
	onUnpinForm: (index: number) => void;
	onSubmit: (action: string, data: Record<string, any>) => Promise<void>;
	readOnlyMode: boolean;
}

const PinnedFormsPanel: React.FC<PinnedFormsPanelProps> = ({ pinnedForms, activePinnedFormIndex, setActivePinnedFormIndex, onUnpinForm, onSubmit, readOnlyMode }) => {
	if (pinnedForms.length === 0) {
		return null;
	}

	const activeForm = pinnedForms[activePinnedFormIndex];

	return (
		<div className="hidden lg:block fixed right-0 top-0 bottom-0 w-[400px] bg-panel border-l border-border z-50">
			<div className="flex flex-col h-full">
				<div className="flex items-center justify-between p-4 border-b border-border bg-panel shadow-sm">
					<h3 className="font-semibold flex items-center gap-2 text-primary">
						<Pin className="w-4 h-4 text-accent" />
						Pinned Forms ({pinnedForms.length})
					</h3>
				</div>

				{pinnedForms.length > 1 && (
					<div className="p-3 border-b border-border bg-card/30">
						<select
							value={activePinnedFormIndex}
							onChange={(e) => setActivePinnedFormIndex(Number(e.target.value))}
							className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-primary outline-none focus:ring-2 ring-accent/20 transition-all"
						>
							{pinnedForms.map((form, idx) => (
								<option key={idx} value={idx}>
									{form.toolName}
								</option>
							))}
						</select>
					</div>
				)}

				<div className="flex-1 overflow-y-auto p-4">
					{activeForm && (
						<div className="space-y-4">
							<div className="flex items-center justify-between pb-3 border-b border-border/50">
								<div>
									<div className="text-xs text-secondary mb-1 uppercase tracking-wider">Tool</div>
									<div className="font-medium text-primary">{activeForm.toolName}</div>
								</div>
								<button
									onClick={() => onUnpinForm(activePinnedFormIndex)}
									className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-1.5"
									title="Unpin this form"
								>
									<X className="w-3.5 h-3.5" />
									Unpin
								</button>
							</div>

							<A2UIProvider
								componentsList={activeForm.blueprint.components}
								onSubmit={onSubmit}
								initialValues={{}}
								formId={activeForm.formId}
							>
								<A2UIRenderer
									componentId={activeForm.blueprint.rootId}
									readOnly={readOnlyMode}
								/>
							</A2UIProvider>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default PinnedFormsPanel;
