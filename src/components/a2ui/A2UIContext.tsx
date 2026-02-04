import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { A2UIComponent, A2UIContextType } from '../../types/a2ui';

const A2UIContext = createContext<A2UIContextType | undefined>(undefined);

export const useA2UI = () => {
	const context = useContext(A2UIContext);
	if (!context) {
		throw new Error('useA2UI must be used within an A2UIProvider');
	}
	return context;
};

interface A2UIProviderProps {
	children: React.ReactNode;
	componentsList: A2UIComponent[];
	onSubmit?: (action: string, values: Record<string, any>) => void;
	initialValues?: Record<string, any>;
}

export const A2UIProvider: React.FC<A2UIProviderProps> = ({ children, componentsList, onSubmit, initialValues = {} }) => {
	const componentMap = React.useMemo(() => {
		const map: Record<string, A2UIComponent> = {};
		componentsList.forEach(c => {
			map[c.id] = c;
		});
		return map;
	}, [componentsList]);

	const [values, setValues] = useState<Record<string, any>>(initialValues);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const setFieldValue = useCallback((name: string, value: any) => {
		setValues(prev => ({ ...prev, [name]: value }));
		if (errors[name]) {
			setErrors(prev => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	}, [errors]);

	const registerComponent = useCallback((component: A2UIComponent) => {

	}, []);

	const submitForm = useCallback((action: string) => {
		console.log(`[A2UI] Submitting action: ${action}`, values);
		if (onSubmit) {
			onSubmit(action, values);
		}
	}, [onSubmit, values]);

	const contextValue: A2UIContextType = {
		components: componentMap,
		values,
		errors,
		setFieldValue,
		submitForm,
		registerComponent
	};

	return (
		<A2UIContext.Provider value={contextValue}>
			{children}
		</A2UIContext.Provider>
	);
};
