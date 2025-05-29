import React from "react";

interface Props {
	children: React.ReactNode;
}

const AuthContainer: React.FC<Props> = ({ children }) => {
	return (
		<div className="fixed inset-0 bg-soma-darkest flex flex-col h-screen">
			<div className="flex-1 flex items-center justify-center px-4 h-full">
				<div className="w-full max-w-[380px]">
					<h1 className="text-2xl font-bold text-soma-text-primary text-center mb-3 tracking-wide">
						Soma
					</h1>
					{children}
				</div>
			</div>
		</div>
	);
};

export default AuthContainer;
