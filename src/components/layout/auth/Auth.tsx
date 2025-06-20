import type React from "react";
import { useState, useRef } from "react";
import { X } from "lucide-react";
import { MoonLoader } from "react-spinners";

import type { FormErrors } from "./types";

import {
  useAuthWindowResize,
  useResendTimer,
  useFormValidation,
  useOAuth,
} from "./hooks";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import OtpVerificationForm from "./OtpVerificationForm";
import LoginVerificationForm from "./LoginVerificationForm";
import { apiHelperService } from "@/services/apiService";

const Auth: React.FC = () => {
  // State
  const [mode, setMode] = useState<AuthMode>("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [trustDevice, setTrustDevice] = useState<boolean>(true);
  const [email, setEmail] = useState("");

  // OTP related state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Custom hooks
  useAuthWindowResize(mode);
  useResendTimer(resendTimer, setResendTimer);
  const validateForm = useFormValidation(
    mode,
    email,
    password,
    confirmPassword,
    username,
  );
  const { handleGoogleLogin } = useOAuth(setIsLoading, setErrors);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      if (mode === "register") {
        setIsLoading(true);
        apiHelperService
          .post("/api/system/v1/users", {
            email: email,
            password: password,
            username: username,
          })
          .then((res: ServerResponse<UserCreationResponse>) => {
            if (res.body.success) {
              setIsLoading(false);
              setMode("verify");
              if (res.body.data?.rateLimited) {
                setResendTimer(3600);
              } else {
                setResendTimer(60);
              }
            } else {
              const errorBody = res.body as ServerErrorResponse;
              setIsLoading(false);
              if (res.statusCode === 409) {
                if (errorBody.error === "USER_ALREADY_EXISTS")
                  setErrors({
                    email: "This email is already registered and verified.",
                  });
              }
            }
          })
          .catch(() => {
            setIsLoading(false);
            setErrors({ email: "Registration failed. Please try again." });
          });
      } else if (mode === "login") {
        setIsLoading(true);
        apiHelperService
          .post("/api/system/v2/users/login", {
            email: email,
            password: password.toString(),
          })
          .then(async (res: ServerResponse<LoginResponse>) => {
            const body = res.body;
            if (body.success && body.data) {
              if (body.data.requiresVerification) {
                setMode("verify-login");
                setResendTimer(60);
                setEmail(body.data.email);
                setOtp(["", "", "", ""]);
              } else {
                await window.secureStore.set(
                  "accessToken",
                  body.data.tokens.accessToken,
                );
                await window.secureStore.set(
                  "refreshToken",
                  body.data.tokens.refreshToken,
                );
                window.userData.loadOnline().then(() => {
                  window.ipcRenderer.send("user:logged-in");
                  window.ipcRenderer.closeAuthWindow();
                });
              }
            } else {
              const errorBody = res.body as ServerErrorResponse;
              switch (res.statusCode) {
                case 401:
                  if (errorBody.error === "INVALID_USERNAME_OR_EMAIL")
                    setErrors({ email: "Invalid username or email" });
                  else if (errorBody.error === "INVALID_PASSWORD")
                    setErrors({ password: "Invalid password" });
                  break;
                case 403:
                  if (errorBody.error === "VERIFY") {
                    setMode("verify");
                    setResendTimer(60);
                    setEmail(errorBody.email);
                    setOtp(["", "", "", "", "", ""]);
                  }
                  break;
                default:
                  setErrors({
                    email: "Internal Server Error",
                    password: "Internal Server Error",
                  });
                  break;
              }
            }
          })
          .catch((err) => console.error("Network error:", err))
          .finally(() => setIsLoading(false));
      }
    }
  };

  const handleVerifyLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");

    if (otpString.length !== 4) {
      setErrors({ otp: "Please enter all 4 digits" });
      return;
    }

    setIsLoading(true);
    apiHelperService
      .post("/api/system/v2/users/login/verify", {
        email: email,
        verificationCode: otpString,
        trustDevice: trustDevice,
      })
      .then(async (res: ServerResponse<LoginCompleteResponse>) => {
        const body = res.body;
        if (body.success && body.data) {
          await window.secureStore.set(
            "accessToken",
            body.data.tokens.accessToken,
          );
          await window.secureStore.set(
            "refreshToken",
            body.data.tokens.refreshToken,
          );
          window.userData.loadOnline().then(() => {
            window.ipcRenderer.send("user:logged-in");
            window.ipcRenderer.closeAuthWindow();
          });
        } else {
          setErrors({ otp: "Invalid verification code" });
        }
      })
      .catch((err) => {
        console.error("Login verification error:", err);
        setErrors({ otp: "Verification failed" });
      })
      .finally(() => setIsLoading(false));
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setErrors({ otp: "Please enter all 6 digits" });
      return;
    }

    setIsLoading(true);
    apiHelperService
      .post("/api/system/v1/users/verify/register", {
        email: email,
        code: otpString,
      })
      .then(async (res: ServerResponse<LoginCompleteResponse>) => {
        const body = res.body;
        if (body.success && body.data) {
          await window.secureStore.set(
            "accessToken",
            body.data.tokens.accessToken,
          );
          await window.secureStore.set(
            "refreshToken",
            body.data.tokens.refreshToken,
          );
          window.userData.loadOnline().then(() => {
            window.ipcRenderer.send("user:logged-in");
            window.ipcRenderer.closeAuthWindow();
          });
        } else {
          setErrors({ otp: "Invalid verification code" });
        }
      })
      .catch((err) => {
        console.error("Verification error:", err);
        setErrors({ otp: "Verification failed" });
      })
      .finally(() => setIsLoading(false));
  };

  const handleResendOtp = () => {
    setIsResending(true);

    if (mode === "verify-login") {
      apiHelperService
        .post("/api/system/v1/users/verify/login/resend", { email: email })
        .then((res: ServerResponse) => {
          const body = res.body;
          if (body.success) {
            setResendTimer(60);
            setOtp(["", "", "", ""]);
            setErrors({});
          }
        });
    }
    if (mode === "verify") {
      apiHelperService
        .post("/api/system/v1/users/verify/register/resend", { email: email })
        .then((res: ServerResponse) => {
          const body = res.body;
          if (body.success) {
            setResendTimer(60);
            setOtp(["", "", "", "", "", ""]);
            setErrors({});
          }
        })
        .finally(() => {
          setIsResending(false);
        });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your forgot password logic here
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <button
          type="button"
          onClick={() => window.ipcRenderer.closeAuthWindow()}
          className="absolute top-3 right-3 p-1.5 bg-soma-dark/50 hover:bg-soma-dark rounded-full transition-all duration-200 z-10 group cursor-pointer"
        >
          <X
            size={16}
            className="text-soma-text-secondary group-hover:text-soma-text-primary transition-colors duration-200"
          />
        </button>

        <MoonLoader size={40} color="var(--color-soma-accent1)" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-soma-darkest flex flex-col h-screen">
      <button
        type="button"
        onClick={() => window.ipcRenderer.closeAuthWindow()}
        className="absolute top-3 right-3 p-1.5 bg-soma-dark/50 hover:bg-soma-dark rounded-full transition-all duration-200 z-10 group cursor-pointer"
      >
        <X
          size={16}
          className="text-soma-text-secondary group-hover:text-soma-text-primary transition-colors duration-200"
        />
      </button>

      <div className="flex-1 flex items-center justify-center px-4 h-full">
        <div className="w-full max-w-[380px]">
          <h1 className="text-2xl font-bold text-soma-text-primary text-center mb-3 tracking-wide">
            Soma
          </h1>

          <div className="bg-soma-dark rounded-2xl p-5 w-full shadow-2xl">
            {/* Header section */}
            <div className="mb-3 text-center">
              <h2 className="text-lg font-semibold text-soma-text-primary mb-1">
                {mode === "login"
                  ? "Welcome Back"
                  : mode === "register"
                    ? "Create Account"
                    : mode === "forgot"
                      ? "Reset Password"
                      : mode === "verify"
                        ? "Verify Your Email"
                        : "Verify Your Device"}
              </h2>
              <p className="text-xs text-soma-text-secondary">
                {mode === "login"
                  ? "Sign in to your account"
                  : mode === "register"
                    ? "Join our learning community"
                    : mode === "forgot"
                      ? "We'll send you a reset link"
                      : mode === "verify"
                        ? `We've sent a verification code to ${email}`
                        : `We've sent a 4-digit code to ${email}`}
              </p>
            </div>

            {mode === "login" && (
              <LoginForm
                onSubmit={handleSubmit}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                errors={errors}
                isLoading={isLoading}
                switchMode={switchMode}
                handleGoogleLogin={handleGoogleLogin}
              />
            )}

            {mode === "register" && (
              <RegisterForm
                onSubmit={handleSubmit}
                email={email}
                setEmail={setEmail}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                errors={errors}
                isLoading={isLoading}
                switchMode={switchMode}
                handleGoogleLogin={handleGoogleLogin}
              />
            )}

            {mode === "forgot" && (
              <ForgotPasswordForm
                onSubmit={handleForgotPassword}
                email={email}
                setEmail={setEmail}
                errors={errors}
                isLoading={isLoading}
                switchMode={switchMode}
              />
            )}

            {mode === "verify" && (
              <OtpVerificationForm
                onSubmit={handleVerifyOtp}
                email={email}
                otp={otp}
                setOtp={setOtp}
                otpRefs={otpRefs}
                errors={errors}
                isLoading={isLoading}
                resendTimer={resendTimer}
                isResending={isResending}
                handleResendOtp={handleResendOtp}
                switchMode={switchMode}
              />
            )}
            {mode === "verify-login" && (
              <LoginVerificationForm
                onSubmit={handleVerifyLogin}
                email={email}
                otp={otp}
                setOtp={setOtp}
                otpRefs={otpRefs}
                errors={errors}
                isLoading={isLoading}
                resendTimer={resendTimer}
                isResending={isResending}
                handleResendOtp={handleResendOtp}
                switchMode={switchMode}
                trustDevice={trustDevice}
                setTrustDevice={setTrustDevice}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
