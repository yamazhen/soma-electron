import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
	mode: AuthMode;
	setMode: (mode: AuthMode) => void;
	email: string;
	setEmail: (email: string) => void;
	password: string;
	setPassword: (password: string) => void;
	confirmPassword: string;
	setConfirmPassword: (confirmPassword: string) => void;
	username: string;
	setUsername: (username: string) => void;
	showPassword: boolean;
	setShowPassword: (show: boolean) => void;
	showConfirmPassword: boolean;
	setShowConfirmPassword: (show: boolean) => void;
	errors: { [key: string]: string };
	setErrors: (errors: { [key: string]: string }) => void;
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
	otp: string[];
	setOtp: (otp: string[]) => void;
	isResending: boolean;
	setIsResending: (resending: boolean) => void;
	resendTimer: number;
	setResendTimer: (timer: number) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [mode, setMode] = useState<AuthMode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [username, setUsername] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<{ [key: string]: string }>({});
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const [otp, setOtp] = useState(["", "", "", "", "", ""]);
	const [isResending, setIsResending] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);

	useEffect(() => {
		// Clear any loading state if we're just mounting the component
		setIsLoading(false);

		// Use the dedicated OAuth interface
		const removeSuccessListener = window.oauthIpc.onAuthSuccess((data) => {
			// Handle success...
			setIsLoading(true);
			if (data?.tokens) {
				Promise.all([
					window.secureStore.set("accessToken", data.tokens.accessToken),
					window.secureStore.set("refreshToken", data.tokens.refreshToken),
				])
					.then(() => {
						return window.userData.loadOnline();
					})
					.then(() => {
						window.ipcRenderer.send("user:logged-in");
						window.ipcRenderer.closeAuthWindow();
					})
					.catch((err) => {
						console.error("Error handling auth success:", err);
						setIsLoading(false);
					});
			} else {
				console.warn("No tokens found in auth success data");
				setIsLoading(false);
			}
		});

		const removeErrorListener = window.oauthIpc.onAuthError((error) => {
			// Handle error...
			setErrors({
				email: "Authentication failed",
				password: error || "Please try again",
			});
			setIsLoading(false);
		});

		const removeGenericErrorListener = window.ipcRenderer.on(
			"oauth:error",
			(_, error) => {
				console.error("OAuth generic error:", error);
				setIsLoading(false);
			},
		);

		return () => {
			removeSuccessListener();
			removeErrorListener();
			if (
				removeGenericErrorListener &&
				typeof removeGenericErrorListener.off === "function"
			) {
				removeGenericErrorListener.remove();
			}
		};
	}, []);

	useEffect(() => {
		if (window.ipcRenderer) {
			const heights = {
				login: 560,
				register: 700,
				forgot: 380,
				verify: 500,
			};

			window.ipcRenderer.resizeAuthWindow(heights[mode]);
		}
	}, [mode]);

	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	const value = {
		mode,
		setMode,
		email,
		setEmail,
		password,
		setPassword,
		confirmPassword,
		setConfirmPassword,
		username,
		setUsername,
		showPassword,
		setShowPassword,
		showConfirmPassword,
		setShowConfirmPassword,
		errors,
		setErrors,
		isLoading,
		setIsLoading,
		otp,
		setOtp,
		isResending,
		setIsResending,
		resendTimer,
		setResendTimer,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthState = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
};
