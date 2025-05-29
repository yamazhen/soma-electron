import type React from "react";
import { Mail, Lock, User } from "lucide-react";
import FormInput from "./FormInput";
import SocialLogin from "./SocialLogin";
import type { RegisterFormProps } from "./types";

const RegisterForm: React.FC<RegisterFormProps> = ({
	onSubmit,
	email,
	setEmail,
	username,
	setUsername,
	password,
	setPassword,
	confirmPassword,
	setConfirmPassword,
	showPassword,
	setShowPassword,
	showConfirmPassword,
	setShowConfirmPassword,
	errors,
	switchMode,
	handleGoogleLogin,
}) => {
	return (
		<>
			<form onSubmit={onSubmit} className="space-y-2.5">
				<FormInput
					id="username"
					label="Username"
					type="text"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					placeholder="Choose a username"
					error={errors.username}
					icon={<User className="text-soma-lightest" size={16} />}
				/>

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
					placeholder="At least 8 characters"
					error={errors.password}
					icon={<Lock className="text-soma-lightest" size={16} />}
					showPasswordToggle
					showPassword={showPassword}
					onTogglePassword={() => setShowPassword(!showPassword)}
				/>

				<FormInput
					id="confirmPassword"
					label="Confirm Password"
					type="password"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					placeholder="Confirm your password"
					error={errors.confirmPassword}
					icon={<Lock className="text-soma-lightest" size={16} />}
					showPasswordToggle
					showPassword={showConfirmPassword}
					onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
				/>

				<button
					type="submit"
					className="w-full bg-gradient-to-r from-soma-accent1 to-soma-accent1/90 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm mt-3 cursor-pointer"
				>
					Create Account
				</button>
			</form>

			<SocialLogin handleGoogleLogin={handleGoogleLogin} />

			{/* Toggle Auth Mode */}
			<div className="text-center mt-3">
				<p className="text-xs text-soma-text-secondary">
					Already have an account?{" "}
					<button
						type="button"
						onClick={() => switchMode("login")}
						className="text-soma-accent1 hover:text-soma-accent1/80 font-medium transition-colors cursor-pointer"
					>
						Sign in
					</button>
				</p>
			</div>
		</>
	);
};

export default RegisterForm;
