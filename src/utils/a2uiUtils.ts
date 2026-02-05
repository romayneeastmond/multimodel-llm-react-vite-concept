import { A2UIBlueprint } from '../types/a2ui';

export function isA2UIBlueprint(data: any): data is A2UIBlueprint {
	return (
		data &&
		typeof data === 'object' &&
		'rootId' in data &&
		'components' in data &&
		Array.isArray(data.components)
	);
}
