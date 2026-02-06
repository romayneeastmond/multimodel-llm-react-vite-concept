
import React from 'react';
import { useA2UI } from '../A2UIContext';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';

export const A2UIForm = ({ title, children, readOnly }: { title: string, children: React.ReactNode, readOnly?: boolean }) => {
	return (
		<div className="space-y-4">
			{title && (
				<div className="pb-3 border-b border-border/50">
					<h2 className="text-base font-semibold text-primary">{title}</h2>
				</div>
			)}
			<div className="space-y-4">
				{children}
			</div>
		</div>
	);
};

export const A2UITextField = ({ label, name, placeholder, readOnly }: { label: string, name: string, placeholder?: string, readOnly?: boolean }) => {
	const { values, setFieldValue } = useA2UI();

	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			<input
				type="text"
				className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm disabled:opacity-50"
				value={values[name] || ''}
				onChange={(e) => setFieldValue(name, e.target.value)}
				placeholder={placeholder}
				disabled={readOnly}
			/>
		</div>
	);
};

export const A2UITextArea = ({ label, name, placeholder, rows = 3, readOnly }: { label: string, name: string, placeholder?: string, rows?: number, readOnly?: boolean }) => {
	const { values, setFieldValue } = useA2UI();

	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			<textarea
				className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm resize-y disabled:opacity-50"
				rows={rows}
				value={values[name] || ''}
				onChange={(e) => setFieldValue(name, e.target.value)}
				placeholder={placeholder}
				disabled={readOnly}
			/>
		</div>
	);
};

export const A2UIDatePicker = ({ label, name, readOnly }: { label: string, name: string, readOnly?: boolean }) => {
	const { values, setFieldValue } = useA2UI();
	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			<input
				type="date"
				className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm disabled:opacity-50"
				value={values[name] || ''}
				onChange={(e) => setFieldValue(name, e.target.value)}
				disabled={readOnly}
			/>
		</div>
	);
};

export const A2UISelect = ({ label, name, options, readOnly }: { label: string, name: string, options: string[], readOnly?: boolean }) => {
	const { values, setFieldValue } = useA2UI();

	return (
		<div className="flex flex-col gap-1.5" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			<div className="relative" >
				<select
					className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-accent/20 transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50"
					value={values[name] || options[0] || ''}
					onChange={(e) => setFieldValue(name, e.target.value)}
					disabled={readOnly}
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

export const A2UIMultiSelect = ({ label, name, options, readOnly }: { label: string, name: string, options: string[], readOnly?: boolean }) => {
	const { values, setFieldValue } = useA2UI();
	const currentValues = (values[name] as string[]) || [];

	const toggleOption = (opt: string) => {
		if (readOnly) return;
		if (currentValues.includes(opt)) {
			setFieldValue(name, currentValues.filter(v => v !== opt));
		} else {
			setFieldValue(name, [...currentValues, opt]);
		}
	};

	return (
		<div className="flex flex-col gap-2" >
			<label className="text-sm font-medium text-secondary" > {label} </label>
			<div className="flex flex-wrap gap-2" >
				{
					options.map(opt => {
						const isSelected = currentValues.includes(opt);
						return (
							<button
								key={opt}
								type="button"
								onClick={() => toggleOption(opt)}
								disabled={readOnly}
								className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all disabled:opacity-50 ${isSelected
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

export const A2UIButton = ({ label, action, readOnly }: { label: string, action: string, readOnly?: boolean }) => {
	const { submitForm } = useA2UI();

	return (
		<button
			type="button"
			onClick={() => submitForm(action)}
			disabled={readOnly}
			className="w-full mt-4 px-4 py-2.5 bg-accent hover:bg-opacity-90 active:scale-[0.98] text-white font-medium rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
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

export const A2UIWeatherCard = ({ city, temperature, condition, humidity, windSpeed }: { city: string, temperature: string, condition: string, humidity?: string, windSpeed?: string }) => {
	const getIcon = () => {
		const c = (condition || '').toLowerCase();
		if (c.includes('rain')) return <CloudRain className="w-8 h-8 text-blue-400" />;
		if (c.includes('cloud')) return <Cloud className="w-8 h-8 text-gray-400" />;
		return <Sun className="w-8 h-8 text-yellow-400" />;
	};

	return (
		<div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 text-primary shadow-sm">
			<div className="flex justify-between items-start">
				<div>
					<h3 className="text-xl font-bold">{city}</h3>
					<p className="text-sm text-secondary capitalize">{condition}</p>
				</div>
				{getIcon()}
			</div>
			<div className="mt-4 flex items-end gap-2">
				<span className="text-4xl font-bold">{temperature}°</span>
			</div>
			{(humidity || windSpeed) && (
				<div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
					{humidity && (
						<div className="flex items-center gap-2 text-sm text-secondary">
							<Droplets className="w-4 h-4" />
							<span>Humidity: {humidity}%</span>
						</div>
					)}
					{windSpeed && (
						<div className="flex items-center gap-2 text-sm text-secondary">
							<Wind className="w-4 h-4" />
							<span>Wind: {windSpeed} km/h</span>
						</div>
					)}
				</div>
			)}
		</div>
	);
};
