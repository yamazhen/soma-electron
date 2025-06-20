import type React from "react";

export interface LoginVerificationFormProps extends AuthFormProps {
  email: string;
  otp: string[];
  setOtp: (otp: string[]) => void;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  resendTimer: number;
  isResending: boolean;
  handleResendOtp: () => void;
  switchMode: (mode: AuthMode) => void;
  trustDevice: boolean;
  setTrustDevice: (value: boolean) => void;
}

export interface FormErrors {
  [key: string]: string;
}

export interface InputProps {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  maxLength?: number;
}

export interface AuthFormProps {
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  errors: FormErrors;
}

export interface LoginFormProps extends AuthFormProps {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  switchMode: (mode: AuthMode) => void;
  handleGoogleLogin: () => void;
}

export interface RegisterFormProps extends AuthFormProps {
  email: string;
  setEmail: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  switchMode: (mode: AuthMode) => void;
  handleGoogleLogin: () => void;
}

export interface ForgotPasswordFormProps extends AuthFormProps {
  email: string;
  setEmail: (value: string) => void;
  switchMode: (mode: AuthMode) => void;
}

export interface OtpVerificationFormProps extends AuthFormProps {
  email: string;
  otp: string[];
  setOtp: (otp: string[]) => void;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  resendTimer: number;
  isResending: boolean;
  handleResendOtp: () => void;
  switchMode: (mode: AuthMode) => void;
}

export interface OtpInputProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  error?: string;
}

export interface SocialLoginProps {
  handleGoogleLogin: () => void;
}
