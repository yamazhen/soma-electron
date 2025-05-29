import type React from "react";
import { useState } from "react";
import type { OtpInputProps } from "./types";
import { useOtpHandlers } from "./hooks";

const OtpInput: React.FC<OtpInputProps> = ({ otp, setOtp, otpRefs, error }) => {
	const [otpInputIds] = useState(() =>
		Array.from(
			{ length: 6 },
			(_, i) => `otp-input-${i}-${Math.random().toString(36).slice(2)}`,
		),
	);

	// Import handlers from the hook
	const { handleOtpChange, handleOtpKeyDown, handleOtpPaste } = useOtpHandlers(
		otp,
		setOtp,
		otpRefs,
	);

	return (
		<>
			<div className="flex justify-center gap-2">
				{otp.map((digit, index) => (
					<input
						key={otpInputIds[index]}
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
							error ? "!border-soma-error" : "border-soma-light/20"
						} rounded-xl text-soma-text-primary text-lg font-semibold focus:border-soma-accent1 focus:outline-none transition-all duration-200`}
					/>
				))}
			</div>
			{error && <p className="text-soma-error text-xs text-center">{error}</p>}
		</>
	);
};

export default OtpInput;
