import { useEffect } from "react";
import validator from "validator";
import type { FormErrors } from "./types";

export const useAuthWindowResize = (mode: AuthMode) => {
  useEffect(() => {
    if (window.ipcRenderer) {
      const heights = {
        login: 560,
        register: 700,
        forgot: 380,
        verify: 500,
        "verify-login": 700,
      };

      window.ipcRenderer.resizeAuthWindow(heights[mode]);
    }
  }, [mode]);
};

export const useResendTimer = (
  resendTimer: number,
  setResendTimer: (value: number) => void,
) => {
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer, setResendTimer]);
};

export const useFormValidation = (
  mode: AuthMode,
  email: string,
  password: string,
  confirmPassword: string = "",
  username: string = "",
) => {
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (mode === "register") {
      if (!username.trim()) {
        newErrors.username = "Username is required";
      } else if (username.trim().length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      }

      if (
        !validator.isStrongPassword(password, {
          minLength: 8,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1,
        })
      ) {
        newErrors.password = "Password is too weak";
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }

      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validator.isEmail(email)) {
        newErrors.email = "Invalid email format";
      }
    }

    if (mode === "login") {
      if (!email.trim()) {
        newErrors.email = "Email or username is required";
      }
      if (!password.trim()) {
        newErrors.password = "Password is required";
      }
    }

    return newErrors;
  };

  return validateForm;
};

export const useOtpHandlers = (
  otp: string[],
  setOtp: (otp: string[]) => void,
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>,
) => {
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
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
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    const newOtp = [...otp];
    const digitsArr = digits.split("");
    for (let i = 0; i < Math.min(6, digitsArr.length); i++) {
      newOtp[i] = digitsArr[i];
    }
    setOtp(newOtp);

    const lastFilledIndex = digits.length - 1;
    if (lastFilledIndex < 5) {
      otpRefs.current[lastFilledIndex + 1]?.focus();
    } else {
      otpRefs.current[5]?.focus();
    }
  };

  return { handleOtpChange, handleOtpKeyDown, handleOtpPaste };
};

export const useOAuth = (
  setIsLoading: (loading: boolean) => void,
  setErrors: (errors: FormErrors) => void,
) => {
  useEffect(() => {
    setIsLoading(false);

    const removeSuccessListener = window.oauthIpc.onAuthSuccess(
      async (data) => {
        setIsLoading(true);
        if (data?.tokens) {
          await window.secureStore.set("accessToken", data.tokens.accessToken);
          await window.secureStore.set(
            "refreshToken",
            data.tokens.refreshToken,
          );
          window.userData.loadOnline().then(() => {
            window.ipcRenderer.send("user:logged-in");
            window.ipcRenderer.closeAuthWindow();
          });
        } else {
          console.warn("No tokens found in auth success data");
          setIsLoading(false);
        }
      },
    );

    const removeErrorListener = window.oauthIpc.onAuthError((error) => {
      setErrors({
        email: "Authentication failed",
        password: error || "Please try again",
      });
      setIsLoading(false);
    });

    return () => {
      removeSuccessListener();
      removeErrorListener();
    };
  }, [setIsLoading, setErrors]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const result = await window.oauthIpc.initGoogleLogin({
        apiUrl: "https://zhen.software",
        clientType: "desktop",
      });

      if (!result.success) {
        throw new Error(
          result.error || "Failed to start Google authentication",
        );
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      setIsLoading(false);
    }
  };

  return { handleGoogleLogin };
};
