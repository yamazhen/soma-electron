import { useState } from "react";

const useLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!password) {
      setErrors({ password: "Password is required" });
      return;
    }

    try {
      await window.serverApi
        .post("/api/system/v1/users/login", {
          usernameOrEmail: email,
          password,
        })
        .then(async (_res: ServerResponse<UserLoginResponse>) => {});
    } catch (err) {
      setErrors({ email: "Login failed" });
    }
  };

  return { email, password, setEmail, setPassword, errors, handleLogin };
};

export default useLogin;
