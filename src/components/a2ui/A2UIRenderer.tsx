import React, { useMemo } from 'react';
import { useA2UI } from './A2UIContext';
import { A2UIForm, A2UITextField, A2UIDatePicker, A2UISelect, A2UIMultiSelect, A2UITextArea, A2UIButton, A2UILayoutRow } from './atoms/index';

const COMPONENT_REGISTRY: Record<string, React.FC<any>> = {
	'Form': A2UIForm,
	'TextField': A2UITextField,
	'DatePicker': A2UIDatePicker,
	'Select': A2UISelect,
	'MultiSelect': A2UIMultiSelect,
	'TextArea': A2UITextArea,
	'Button': A2UIButton,
	'LayoutRow': A2UILayoutRow
};

interface RendererProps {
	componentId: string;
	readOnly?: boolean;
}

const A2UIRenderer: React.FC<RendererProps> = ({ componentId, readOnly }) => {
	const { components } = useA2UI();

	const component = components[componentId];

	if (!component) {
		return <div className="text-red-500 text-xs">Component not found: {componentId}</div>;
	}

	const ComponentType = COMPONENT_REGISTRY[component.type];

	if (!ComponentType) {
		return (
			<div className="p-2 border border-dashed border-yellow-500 rounded bg-yellow-50/10 text-xs">
				Unknown Type: {component.type} (ID: {componentId})
			</div>
		);
	}

	const renderedChildren = useMemo(() => {
		if (!component.children || component.children.length === 0) return null;

		return component.children.map(childId => (
			<A2UIRenderer key={childId} componentId={childId} readOnly={readOnly} />
		));
	}, [component.children, readOnly]);

	return (
		<ComponentType {...(component.props || {})} readOnly={readOnly}>
			{renderedChildren}
		</ComponentType>
	);
};

export default A2UIRenderer;
