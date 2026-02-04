
import React from 'react';
import { useA2UI } from '../A2UIContext';

export const A2UIForm = ({ title, children }: { title: string, children: React.ReactNode }) => {
	return (
		<div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
			{title && (
				<div className="pb-4 border-b border-border">
					<h2 className="text-lg font-semibold text-primary">{title}</h2>
				</div>
			)}
			<div className="space-y-4">
				{children}
			</div>
		</div>
	);
};

export const A2UITextField = ({ label, name, placeholder }: { label: string, name: string, placeholder?: string }) => {
	const { values, setFieldValue } = useA2UI();

	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			< input
				type="text"
				className="w-full px-3 py-2 bg-input border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-secondary/50"
				value={values[name] || ''}
				onChange={(e) => setFieldValue(name, e.target.value)}
				placeholder={placeholder}
			/>
		</div>
	);
};

export const A2UITextArea = ({ label, name, placeholder, rows = 3 }: { label: string, name: string, placeholder?: string, rows?: number }) => {
	const { values, setFieldValue } = useA2UI();

	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			< textarea
				className="w-full px-3 py-2 bg-input border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all placeholder:text-secondary/50 resize-y"
				rows={rows}
				value={values[name] || ''}
				onChange={(e) => setFieldValue(name, e.target.value)}
				placeholder={placeholder}
			/>
		</div>
	);
};

export const A2UIDatePicker = ({ label, name }: { label: string, name: string }) => {
	const { values, setFieldValue } = useA2UI();
	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			< input
				type="date"
				className="w-full px-3 py-2 bg-input border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all [color-scheme:dark]"
				value={values[name] || ''}
				onChange={(e) => setFieldValue(name, e.target.value)}
			/>
		</div>
	);
};

export const A2UISelect = ({ label, name, options }: { label: string, name: string, options: string[] }) => {
	const { values, setFieldValue } = useA2UI();

	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			< div className="relative" >
				<select
					className="w-full px-3 py-2 bg-input border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all appearance-none cursor-pointer"
					value={values[name] || options[0] || ''}
					onChange={(e) => setFieldValue(name, e.target.value)}
				>
					{
						options.map(opt => (
							<option key={opt} value={opt} > {opt} </option>
						))
					}
				</select>
				<div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" >
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
						<path d="m6 9 6 6 6-6" />
					</svg>
				</div>
			</div>
		</div>
	);
};

export const A2UIMultiSelect = ({ label, name, options }: { label: string, name: string, options: string[] }) => {
	const { values, setFieldValue } = useA2UI();
	const currentValues = (values[name] as string[]) || [];

	const toggleOption = (opt: string) => {
		if (currentValues.includes(opt)) {
			setFieldValue(name, currentValues.filter(v => v !== opt));
		} else {
			setFieldValue(name, [...currentValues, opt]);
		}
	};

	return (
		<div className="flex flex-col gap-2" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			< div className="flex flex-wrap gap-2" >
				{
					options.map(opt => {
						const isSelected = currentValues.includes(opt);
						return (
							<button
								key={opt}
								type="button"
								onClick={() => toggleOption(opt)}
								className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${isSelected
									? 'bg-accent/20 border-accent text-accent'
									: 'bg-input border-border text-secondary hover:border-accent/50 hover:text-primary'
									}`}
							>
								{opt}
							</button>
						);
					})}
			</div>
		</div>
	);
};

export const A2UIButton = ({ label, action }: { label: string, action: string }) => {
	const { submitForm } = useA2UI();

	return (
		<button
			type="button"
			onClick={() => submitForm(action)}
			className="w-full mt-4 px-4 py-2.5 bg-accent hover:bg-opacity-90 active:scale-[0.98] text-white font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
		>
			{label}
		</button>
	);
};

export const A2UILayoutRow = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="flex flex-col sm:flex-row gap-4 w-full" >
			{
				React.Children.map(children, child => (
					<div className="flex-1 min-w-0" >
						{child}
					</div>
				))
			}
		</div>
	);
};
