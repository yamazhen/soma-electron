import type React from "react";
import { ShieldCheck, Clock, ChevronLeft } from "lucide-react";
import type { LoginVerificationFormProps } from "./types";
import { Checkbox } from "@headlessui/react";

const LoginVerificationForm: React.FC<LoginVerificationFormProps> = ({
  onSubmit,
  otp,
  setOtp,
  otpRefs,
  email,
  errors,
  resendTimer,
  isResending,
  handleResendOtp,
  switchMode,
  trustDevice,
  setTrustDevice,
}) => {
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 4);

    const newOtp = [...otp];
    const digitsArr = digits.split("");
    for (let i = 0; i < Math.min(6, digitsArr.length); i++) {
      newOtp[i] = digitsArr[i];
    }
    setOtp(newOtp);

    const lastFilledIndex = digits.length - 1;
    if (lastFilledIndex < 3) {
      otpRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      otpRefs.current[3]?.focus();
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Device Verification Icon */}
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-soma-accent1/20 rounded-full">
          <ShieldCheck className="text-soma-accent1" size={32} />
        </div>
      </div>

      {/* Description */}
      <div className="text-center space-y-2">
        <p className="text-sm text-soma-text-primary">Device Verification</p>
        <p className="text-xs text-soma-text-secondary">
          We&apos;ve sent a 4-digit verification code to {email}
        </p>
      </div>

      {/* 4-digit OTP Input Fields */}
      <div className="flex justify-center gap-2">
        {otp.slice(0, 4).map((digit, index) => (
          <input
            key={`login-otp-${index}`}
            ref={(el) => {
              otpRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={handleOtpPaste}
            className={`w-12 h-12 text-center bg-soma-medium border ${
              errors.otp ? "!border-soma-error" : "border-soma-light/20"
            } rounded-xl text-soma-text-primary text-lg font-semibold focus:border-soma-accent1 focus:outline-none transition-all duration-200`}
          />
        ))}
      </div>
      {errors.otp && (
        <p className="text-soma-error text-xs text-center">{errors.otp}</p>
      )}

      {/* Trust Device Checkbox */}
      <div className="flex items-center justify-center gap-2 bg-soma-medium/50 rounded-lg p-3">
        <Checkbox
          checked={trustDevice}
          onChange={setTrustDevice}
          className="group block size-4 rounded border border-soma-light/20 bg-soma-medium data-[checked]:bg-soma-accent1 data-[checked]:border-soma-accent1 focus:outline-none data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-soma-accent1"
        >
          {/* Checkmark icon */}
          <svg
            className="stroke-white opacity-0 group-data-[checked]:opacity-100"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M3 8L6 11L11 3.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Checkbox>
        <label
          className="text-sm text-soma-text-secondary cursor-pointer"
          onClick={() => setTrustDevice(!trustDevice)}
        >
          Trust this device for 30 days
        </label>
      </div>

      {/* Expiration Notice */}
      <div className="flex items-center justify-center gap-2 bg-soma-medium/30 rounded-lg p-2">
        <Clock className="text-soma-warning" size={14} />
        <p className="text-xs text-soma-text-secondary">
          This code expires in 10 minutes
        </p>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-soma-accent1 to-soma-accent1/90 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm cursor-pointer"
      >
        Verify Device
      </button>

      {/* Resend Code */}
      <div className="text-center">
        <p className="text-xs text-soma-text-secondary">
          Didn&apos;t receive the code?{" "}
          {resendTimer > 0 ? (
            <span className="text-soma-lightest">Resend in {resendTimer}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending}
              className="text-soma-accent1 hover:text-soma-accent1/80 font-medium transition-colors disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          )}
        </p>
      </div>

      {/* Back button */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="inline-flex items-center gap-1.5 text-soma-text-secondary hover:text-soma-text-primary transition-colors duration-200"
        >
          <ChevronLeft size={16} />
          <span className="text-sm font-medium cursor-pointer">
            Back to login
          </span>
        </button>
      </div>
    </form>
  );
};

export default LoginVerificationForm;
