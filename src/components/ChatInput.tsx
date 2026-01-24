import React, { useState, useEffect, forwardRef, useRef } from 'react';

interface ChatInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	value: string;
	onValueChange: (value: string) => void;
	onSend: (value: string) => void;
	isGenerating: boolean;
	placeholder?: string;
	className?: string;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({ value, onValueChange, onSend, isGenerating, className, ...props }, ref) => {
	const [localValue, setLocalValue] = useState(value);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const newValue = e.target.value;
		setLocalValue(newValue);

		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			onValueChange(newValue);
		}, 100);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			onValueChange(localValue);
			setTimeout(() => {
				onSend(localValue);
			}, 0);
		}
		if (props.onKeyDown) props.onKeyDown(e);
	};

	const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
		const target = e.target as HTMLTextAreaElement;
		target.style.height = 'auto';
		target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
		if (props.onInput) props.onInput(e);
	};

	useEffect(() => {
		if (ref && 'current' in ref && ref.current) {
			ref.current.style.height = 'auto';
			ref.current.style.height = `${Math.min(ref.current.scrollHeight, 150)}px`;
		}
	}, [localValue, ref]);

	return (
		<textarea
			ref={ref}
			disabled={isGenerating}
			value={localValue}
			onChange={handleChange}
			onKeyDown={handleKeyDown}
			onInput={handleInput}
			className={className}
			style={{
				fieldSizing: 'content',
				height: 'auto',
				marginTop: '10px',
				maxHeight: '150px'
			} as any}
			{...props}
		/>
	);
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
