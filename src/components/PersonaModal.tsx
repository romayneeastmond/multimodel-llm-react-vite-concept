import React from 'react';
import { UserCircle, X, CheckCircle2, Circle, Edit2, Trash2, Plus, Check } from 'lucide-react';
import { Persona } from '../types/index';

interface PersonaModalProps {
	isOpen: boolean;
	onClose: () => void;
	personas: Persona[];
	selectedPersonaId: string | null;
	onSelectPersona: (id: string | null) => void;
	onEditPersona: (persona: Persona) => void;
	onDeletePersona: (id: string) => void;
	editingPersonaId: string | null;
	personaForm: Partial<Persona>;
	setPersonaForm: React.Dispatch<React.SetStateAction<Partial<Persona>>>;
	onSave: (e: React.FormEvent) => void;
	onCancelEdit: () => void;
}

const PersonaModal = ({
	isOpen,
	onClose,
	personas,
	selectedPersonaId,
	onSelectPersona,
	onEditPersona,
	onDeletePersona,
	editingPersonaId,
	personaForm,
	setPersonaForm,
	onSave,
	onCancelEdit
}: PersonaModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[70] bg-app flex flex-col animate-in zoom-in-95 duration-200">
			<div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel shadow-sm">
				<div className="flex items-center gap-3">
					<UserCircle className="w-6 h-6 text-accent" />
					<div>
						<h2 className="text-sm font-bold tracking-tight">Persona Settings</h2>
						<p className="text-[10px] text-secondary">Define persistent AI behavior</p>
					</div>
				</div>
				<button
					onClick={onClose}
					className="p-2 hover:bg-card-hover rounded-xl transition-all hover:rotate-90 hover:scale-110"
				>
					<X className="w-6 h-6" />
				</button>
			</div>
			<div className="flex-1 flex flex-col md:flex-row overflow-hidden">
				<div className="w-full md:w-80 border-r border-border bg-panel overflow-y-auto p-4 space-y-4">
					<h3 className="text-xs font-bold text-secondary uppercase px-1">Global Active Persona</h3>
					<div className="space-y-2">
						<button
							onClick={() => onSelectPersona(null)}
							className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedPersonaId === null
								? 'bg-accent/10 border-accent text-accent'
								: 'bg-card border-border hover:bg-card-hover'
								}`}
						>
							{selectedPersonaId === null ? (
								<CheckCircle2 className="w-5 h-5 text-accent" />
							) : (
								<Circle className="w-5 h-5 opacity-20" />
							)}

							<div className="text-left">
								<span className="text-sm font-bold block">Default</span>
								<span className="text-[10px] opacity-70 block">
									No specific instruction
								</span>
							</div>
						</button>

						{personas.map(p => (
							<div key={p.id} className="relative group">
								<button
									onClick={() => onSelectPersona(p.id)}
									className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3 pr-20 ${selectedPersonaId === p.id
										? 'bg-accent/10 border-accent text-accent'
										: 'bg-card border-border hover:bg-card-hover'
										}`}
								>
									<div className="shrink-0">
										{selectedPersonaId === p.id ? (
											<CheckCircle2 className="w-5 h-5 text-accent" />
										) : (
											<Circle className="w-5 h-5 opacity-20" />
										)}
									</div>

									<div className="min-w-0 flex-1">
										<p className="text-sm font-bold truncate">{p.name}</p>
										<p className="text-[10px] truncate opacity-60 mt-0.5">
											{p.description}
										</p>
									</div>
								</button>

								<div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
									<button
										onClick={(e) => {
											e.stopPropagation();
											onEditPersona(p);
										}}
										className="p-1.5 text-secondary hover:text-primary rounded-lg bg-card/40 border border-border/50 shadow-sm"
									>
										<Edit2 className="w-3.5 h-3.5" />
									</button>

									<button
										onClick={(e) => {
											e.stopPropagation();
											onDeletePersona(p.id);
										}}
										className="p-1.5 text-secondary hover:text-red-400 rounded-lg bg-card/40 border border-border/50 shadow-sm"
									>
										<Trash2 className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>
						))}

					</div>
				</div>
				<div className="flex-1 overflow-y-auto p-6 md:p-10 bg-app/50">
					<div className="max-w-2xl mx-auto">
						<h3 className="text-sm font-bold mb-8 flex items-center gap-2 tracking-tight">{editingPersonaId ? <><Edit2 className="w-4 h-4 text-accent" /> Edit Persona</> : <><Plus className="w-4 h-4 text-accent" /> Create New Persona</>}</h3>
						<form onSubmit={onSave} className="space-y-6">
							<div>
								<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Name</label>
								<input
									type="text"
									value={personaForm.name || ''}
									onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })}
									placeholder="e.g. Code Expert"
									className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm"
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Description</label>
								<input
									type="text"
									value={personaForm.description || ''}
									onChange={(e) => setPersonaForm({ ...personaForm, description: e.target.value })}
									placeholder="Brief description"
									className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm"
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">System Instruction</label>
								<textarea
									rows={6}
									value={personaForm.systemInstruction || ''}
									onChange={(e) => setPersonaForm({ ...personaForm, systemInstruction: e.target.value })}
									placeholder="AI instructions..."
									className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all resize-none shadow-sm font-mono"
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-secondary mb-2 uppercase tracking-widest">Multi-step Instruction</label>
								<input
									type="text"
									value={personaForm.multiStepInstruction || ''}
									onChange={(e) => setPersonaForm({ ...personaForm, multiStepInstruction: e.target.value })}
									placeholder="e.g. Please provide your source code..."
									className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm"
								/>
							</div>
							<div className="pt-4 flex items-center justify-end gap-3">
								{editingPersonaId &&
									<button
										type="button"
										onClick={onCancelEdit}
										className="px-6 py-3 border border-border rounded-xl text-sm font-bold hover:bg-card-hover transition-colors"
									>
										Cancel
									</button>
								}

								<button type="submit" className="flex items-center gap-2.5 bg-accent text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 hover:opacity-95 active:scale-95 transition-all">
									<Check className="w-4 h-4" />{editingPersonaId ? 'Update Persona' : 'Save Persona'}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PersonaModal;
