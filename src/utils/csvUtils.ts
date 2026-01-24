export const calculateCsvRows = (csvContent: string): number => {
	if (!csvContent) return 0;
	const lines = csvContent.split('\n').filter(line => line.trim() !== '');
	return Math.max(0, lines.length - 1);
};

export const parseCsv = (csvContent: string): { headers: string[], rows: string[][] } => {
	if (!csvContent) return { headers: [], rows: [] };

	const lines = csvContent.split('\n').filter(line => line.trim() !== '');
	if (lines.length === 0) return { headers: [], rows: [] };

	const parseLine = (line: string): string[] => {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current.trim());
		return result;
	};

	const headers = parseLine(lines[0]);
	const rows = lines.slice(1).map(line => parseLine(line));

	return { headers, rows };
};
