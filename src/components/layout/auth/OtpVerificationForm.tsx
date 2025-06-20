import type React from "react";
import { ShieldCheck, Clock, ChevronLeft } from "lucide-react";
import OtpInput from "./OtpInput";
import type { OtpVerificationFormProps } from "./types";

const OtpVerificationForm: React.FC<OtpVerificationFormProps> = ({
  onSubmit,
  otp,
  setOtp,
  otpRefs,
  errors,
  resendTimer,
  isResending,
  handleResendOtp,
  switchMode,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* OTP Icon */}
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-soma-accent1/20 rounded-full">
          <ShieldCheck className="text-soma-accent1" size={32} />
        </div>
      </div>

      {/* OTP Input Fields */}
      <OtpInput
        otp={otp}
        setOtp={setOtp}
        otpRefs={otpRefs}
        error={errors.otp}
      />

      {/* Expiration Notice */}
      <div className="flex items-center justify-center gap-2 bg-soma-medium/50 rounded-lg p-2">
        <Clock className="text-soma-warning" size={14} />
        <p className="text-xs text-soma-text-secondary">
          This code expires in 10 minutes
        </p>
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-soma-accent1 to-soma-accent1/90 text-white py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm cursor-pointer"
      >
        Verify Email
      </button>

      {/* Resend OTP */}
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
              className="text-soma-accent1 hover:text-soma-accent1/80 font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </p>
      </div>

      {/* Back button */}
      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => switchMode("register")}
          className="inline-flex items-center gap-1.5 text-soma-text-secondary hover:text-soma-text-primary transition-colors duration-200"
        >
          <ChevronLeft size={16} />
          <span className="text-sm font-medium cursor-pointer">
            Back to registration
          </span>
        </button>
      </div>
    </form>
  );
};

export default OtpVerificationForm;
