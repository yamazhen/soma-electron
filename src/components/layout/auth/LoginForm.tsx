import type React from "react";
import { Mail, Lock } from "lucide-react";
import FormInput from "./FormInput";
import SocialLogin from "./SocialLogin";
import type { LoginFormProps } from "./types";

const LoginForm: React.FC<LoginFormProps> = ({
	onSubmit,
	email,
	setEmail,
	password,
	setPassword,
	showPassword,
	setShowPassword,
	errors,
	switchMode,
	handleGoogleLogin,
}) => {
	return (
		<>
			<form onSubmit={onSubmit} className="space-y-3">
				<FormInput
					id="email"
					label="Email Address"
					type="text"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Enter your email"
					error={errors.email}
					icon={<Mail className="text-soma-lightest" size={16} />}
				/>

				<FormInput
					id="password"
					label="Password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Enter password"
					error={errors.password}
					icon={<Lock className="text-soma-lightest" size={16} />}
					showPasswordToggle
					showPassword={showPassword}
					onTogglePassword={() => setShowPassword(!showPassword)}
				/>

				<div className="flex justify-end py-0.5">
					<button
						type="button"
						onClick={() => switchMode("forgot")}
						className="text-xs text-soma-accent1 hover:text-soma-accent1/80 transition-colors cursor-pointer"
					>
						Forgot password?
					</button>
				</div>

				<button
					type="submit"
					className="w-full bg-gradient-to-r from-soma-accent1 to-soma-accent1/90 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm mt-3 cursor-pointer"
				>
					Sign In
				</button>
			</form>

			<SocialLogin handleGoogleLogin={handleGoogleLogin} />

			{/* Toggle Auth Mode */}
			<div className="text-center mt-3">
				<p className="text-xs text-soma-text-secondary">
					Don't have an account?{" "}
					<button
						type="button"
						onClick={() => switchMode("register")}
						className="text-soma-accent1 hover:text-soma-accent1/80 font-medium transition-colors cursor-pointer"
					>
						Sign up
					</button>
				</p>
			</div>
		</>
	);
};

export default LoginForm;
