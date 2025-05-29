import type React from "react";
import { Mail, ChevronLeft } from "lucide-react";
import FormInput from "./FormInput";
import type { ForgotPasswordFormProps } from "./types";

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
	onSubmit,
	email,
	setEmail,
	errors,
	switchMode,
}) => {
	return (
		<form onSubmit={onSubmit} className="space-y-3">
			<FormInput
				id="email"
				label="Email Address"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Enter your email"
				error={errors.email}
				icon={<Mail className="text-soma-lightest" size={16} />}
			/>

			<button
				type="submit"
				className="w-full bg-gradient-to-r from-soma-accent1 to-soma-accent1/90 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm"
			>
				Send Reset Link
			</button>

			{/* Back button */}
			<div className="mt-3 text-center">
				<button
					type="button"
					onClick={() => switchMode("login")}
					className="inline-flex items-center gap-1.5 text-soma-text-secondary hover:text-soma-text-primary transition-colors duration-200"
				>
					<ChevronLeft size={16} />
					<span className="text-sm font-medium">Back to login</span>
				</button>
			</div>
		</form>
	);
};

export default ForgotPasswordForm;
