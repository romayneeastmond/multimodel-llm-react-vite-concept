
import React from 'react';
import { useA2UI } from '../A2UIContext';
import { Cloud, Sun, CloudRain, Wind, Droplets, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

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

	React.useEffect(() => {
		if (values[name] === undefined) {
			setFieldValue(name, '');
		}
	}, [name, values, setFieldValue]);

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

	React.useEffect(() => {
		if (values[name] === undefined) {
			setFieldValue(name, '');
		}
	}, [name, values, setFieldValue]);

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

	React.useEffect(() => {
		if (values[name] === undefined) {
			setFieldValue(name, '');
		}
	}, [name, values, setFieldValue]);

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

	React.useEffect(() => {
		if (values[name] === undefined && options.length > 0) {
			setFieldValue(name, options[0]);
		}
	}, [name, options, values, setFieldValue]);

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

	React.useEffect(() => {
		if (values[name] === undefined) {
			setFieldValue(name, []);
		}
	}, [name, values, setFieldValue]);

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
		if (c.includes('rain')) return <CloudRain className="w-16 h-16 text-blue-400" />;
		if (c.includes('cloud')) return <Cloud className="w-16 h-16 text-gray-400" />;
		return <Sun className="w-16 h-16 text-yellow-400" />;
	};

	return (
		<div className="bg-gradient-to-br from-green-500/10 to-green-500/10 border border-green-500/20 rounded-xl p-6 text-primary shadow-sm">
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

export const A2UICalendar = ({ title, year, month, events = [] }: { title?: string, year: number, month: number, events: any[] }) => {
	const [currentDate, setCurrentDate] = React.useState(new Date(year, month - 1, 1));

	React.useEffect(() => {
		setCurrentDate(new Date(year, month - 1, 1));
	}, [year, month]);

	const getDaysInMonth = (date: Date) => {
		const y = date.getFullYear();
		const m = date.getMonth();
		const days = new Date(y, m + 1, 0).getDate();
		const firstDay = new Date(y, m, 1).getDay();
		return { days, firstDay };
	};

	const { days, firstDay } = getDaysInMonth(currentDate);
	const monthName = currentDate.toLocaleString('default', { month: 'long' });
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth();

	const categoryColors: Record<string, string> = {
		work: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
		personal: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50',
		urgent: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
		meeting: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50',
		default: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
	};

	const handlePrevMonth = () => {
		setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
	};

	const handleNextMonth = () => {
		setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
	};

	const getEventsForDay = (day: number) => {
		const currentTimestamp = new Date(currentYear, currentMonth, day).getTime();

		return events.filter(e => {
			if (!e.start) return false;

			const [sY, sM, sD] = e.start.split('-').map(Number);
			const start = new Date(sY, sM - 1, sD).getTime();

			const endStr = e.end || e.start;
			const [eY, eM, eD] = endStr.split('-').map(Number);
			const end = new Date(eY, eM - 1, eD).getTime();

			return currentTimestamp >= start && currentTimestamp <= end;
		});
	};

	const renderCalendarCells = () => {
		const cells = [];

		for (let i = 0; i < firstDay; i++) {
			cells.push(<div key={`pad-${i}`} className="min-h-[100px] bg-card/30 border border-border/50 p-2 opacity-50"></div>);
		}

		for (let day = 1; day <= days; day++) {
			const dayEvents = getEventsForDay(day);
			cells.push(
				<div key={`day-${day}`} className="min-h-[100px] bg-card border border-border/50 p-2 flex flex-col gap-1 hover:bg-accent/5 transition-colors">
					<div className="text-right text-xs font-medium text-secondary mb-1">{day}</div>
					{dayEvents.map((evt, idx) => (
						<button
							key={`${evt.id}-${day}-${idx}`}
							onClick={() => evt.url && window.open(evt.url, '_blank')}
							className={`text-left text-[10px] px-1.5 py-1 rounded border w-full transition-all hover:brightness-95 flex items-center justify-between gap-1 ${categoryColors[evt.category || 'default'] || categoryColors.default} ${evt.url ? 'cursor-pointer hover:underline' : 'cursor-default'}`}
							title={`${evt.title} (${evt.start} - ${evt.end})`}
						>
							<span className="truncate">{evt.title}</span>
							{evt.url && <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />}
						</button>
					))}
				</div>
			);
		}
		return cells;
	};

	return (
		<div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
			<div className="p-4 flex items-center justify-between border-b border-border bg-card/50">
				<div className="flex flex-col gap-1">
					{title && <h2 className="text-sm font-bold text-primary opacity-80 uppercase tracking-wide">{title}</h2>}
					<h3 className="font-semibold text-primary flex items-center gap-2">
						{monthName} <span className="text-secondary font-normal">{currentYear}</span>
					</h3>
				</div>
				<div className="flex gap-1">
					<button onClick={handlePrevMonth} className="p-1 hover:bg-accent/10 rounded-lg transition-colors text-secondary hover:text-primary">
						<ChevronLeft className="w-5 h-5" />
					</button>
					<button onClick={handleNextMonth} className="p-1 hover:bg-accent/10 rounded-lg transition-colors text-secondary hover:text-primary">
						<ChevronRight className="w-5 h-5" />
					</button>
				</div>
			</div>
			<div className="grid grid-cols-7 border-b border-border bg-card/30">
				{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
					<div key={d} className="p-2 text-center text-xs font-medium text-secondary/80 uppercase tracking-wider">
						{d}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7">
				{renderCalendarCells()}
			</div>
		</div>
	);
};
