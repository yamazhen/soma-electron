import type React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { InputProps } from "./types";

const FormInput: React.FC<InputProps> = ({
	id,
	label,
	type,
	value,
	onChange,
	placeholder,
	error,
	icon,
	showPasswordToggle = false,
	showPassword = false,
	onTogglePassword,
	maxLength,
}) => {
	return (
		<div>
			<label
				className="block text-xs font-medium text-soma-text-secondary mb-1"
				htmlFor={id}
			>
				{label}
			</label>
			<div className="relative">
				{icon && (
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						{icon}
					</div>
				)}
				<input
					id={id}
					type={
						showPasswordToggle ? (showPassword ? "text" : "password") : type
					}
					value={value}
					onChange={onChange}
					maxLength={maxLength}
					className={`w-full bg-soma-medium border ${
						error ? "!border-soma-error" : "border-soma-light/20"
					} rounded-xl ${icon ? "pl-9" : "pl-3"} ${
						showPasswordToggle ? "pr-10" : "pr-3"
					} py-2 text-soma-text-primary placeholder:text-soma-lightest focus:border-soma-accent1 focus:outline-none transition-all duration-200 text-sm`}
					placeholder={placeholder}
				/>
				{showPasswordToggle && onTogglePassword && (
					<button
						type="button"
						onClick={onTogglePassword}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-soma-lightest hover:text-soma-text-primary transition-colors p-0.5"
						tabIndex={-1}
					>
						{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
					</button>
				)}
			</div>
			{error && <p className="text-soma-error text-xs mt-0.5 ml-1">{error}</p>}
		</div>
	);
};

export default FormInput;
