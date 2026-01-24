import React, { useMemo } from 'react';
import {
	BarChart, Bar,
	LineChart, Line,
	AreaChart, Area,
	PieChart, Pie, Cell,
	XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

interface ChartConfig {
	type: 'bar' | 'line' | 'area' | 'pie';
	title?: string;
	description?: string;
	data: any[];
	xAxisKey: string;
	series: Array<{
		key: string;
		color?: string;
		name?: string;
	}>;
}

const ChartBlock = ({ codeContent }: { codeContent: string }) => {
	const config = useMemo(() => {
		try {
			const cleanContent = codeContent.trim();
			return JSON.parse(cleanContent) as ChartConfig;
		} catch (e) {
			console.error("Failed to parse chart JSON:", e);
			return null;
		}
	}, [codeContent]);

	if (!config) {
		return (
			<div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 text-sm">
				Failed to render chart: Invalid JSON data.
			</div>
		);
	}

	const renderChart = () => {
		switch (config.type.toLowerCase()) {
			case 'bar':
				return (
					<BarChart data={config.data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#333" />
						<XAxis dataKey={config.xAxisKey} stroke="#888" tick={{ fill: '#888' }} />
						<YAxis stroke="#888" tick={{ fill: '#888' }} />
						<Tooltip
							contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
							itemStyle={{ color: '#fff' }}
						/>
						<Legend />
						{config.series.map((s, i) => (
							<Bar
								key={s.key}
								dataKey={s.key}
								name={s.name || s.key}
								fill={s.color || COLORS[i % COLORS.length]}
							/>
						))}
					</BarChart>
				);
			case 'line':
				return (
					<LineChart data={config.data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#333" />
						<XAxis dataKey={config.xAxisKey} stroke="#888" tick={{ fill: '#888' }} />
						<YAxis stroke="#888" tick={{ fill: '#888' }} />
						<Tooltip
							contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
							itemStyle={{ color: '#fff' }}
						/>
						<Legend />
						{config.series.map((s, i) => (
							<Line
								key={s.key}
								type="monotone"
								dataKey={s.key}
								name={s.name || s.key}
								stroke={s.color || COLORS[i % COLORS.length]}
								strokeWidth={2}
								dot={{ r: 4 }}
							/>
						))}
					</LineChart>
				);
			case 'area':
				return (
					<AreaChart data={config.data}>
						<CartesianGrid strokeDasharray="3 3" stroke="#333" />
						<XAxis dataKey={config.xAxisKey} stroke="#888" tick={{ fill: '#888' }} />
						<YAxis stroke="#888" tick={{ fill: '#888' }} />
						<Tooltip
							contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
							itemStyle={{ color: '#fff' }}
						/>
						<Legend />
						{config.series.map((s, i) => (
							<Area
								key={s.key}
								type="monotone"
								dataKey={s.key}
								name={s.name || s.key}
								stroke={s.color || COLORS[i % COLORS.length]}
								fill={s.color || COLORS[i % COLORS.length]}
								fillOpacity={0.3}
							/>
						))}
					</AreaChart>
				);
			case 'pie':
				return (
					<PieChart>
						<Tooltip
							contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
							itemStyle={{ color: '#fff' }}
						/>
						<Legend />
						{config.series.map((s, i) => (
							<Pie
								key={s.key}
								data={config.data}
								dataKey={s.key}
								nameKey={config.xAxisKey}
								cx="50%"
								cy="50%"
								outerRadius={100}
								fill={s.color || COLORS[i % COLORS.length]}
								label
							>
								{config.data.map((entry: any, index: number) => (
									<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
								))}
							</Pie>
						))}
					</PieChart>
				);
			default:
				return (
					<div className="text-secondary text-sm p-4 text-center">
						Unsupported chart type: {config.type}
					</div>
				);
		}
	};

	return (
		<div className="my-6 bg-card border border-border rounded-xl p-6 shadow-sm">
			{config.title && (
				<h3 className="text-lg font-bold text-primary mb-2 text-center">{config.title}</h3>
			)}
			{config.description && (
				<p className="text-sm text-secondary mb-6 text-center max-w-2xl mx-auto">{config.description}</p>
			)}
			<div className="w-full h-[350px] text-xs">
				<ResponsiveContainer width="100%" height="100%">
					{renderChart()}
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default ChartBlock;
