import React from 'react';

const CodeBlock = ({ className, children, ...props }: any) => {
	return (
		<code className="bg-card px-1.5 py-0.5 rounded text-sm font-mono text-[#eb6f92]" {...props}>
			{children}
		</code>
	);
};

export default CodeBlock;