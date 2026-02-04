export interface A2UIProp {
	[key: string]: any;
}

export interface A2UIComponent {
	id: string;
	type: string;
	props?: A2UIProp;
	children?: string[];
}

export interface A2UIBlueprint {
	rootId: string;
	components: A2UIComponent[];
}

export interface A2UIContextType {
	components: Record<string, A2UIComponent>;
	values: Record<string, any>;
	errors: Record<string, string>;
	setFieldValue: (name: string, value: any) => void;
	submitForm: (action: string) => void;
	registerComponent: (component: A2UIComponent) => void;
}
