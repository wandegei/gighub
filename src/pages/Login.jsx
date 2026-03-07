import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto redirect if already logged in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      window.location.href = "/Dashboard";
    }
  };

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/Dashboard";
    }
  };

  const handleSignup = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setError("Account created! Check your email to confirm.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1117] px-4">
      <div className="bg-[#1A1D2E] w-full max-w-md p-8 rounded-2xl shadow-xl">

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Welcome to GigHub
        </h2>

        {/* Tabs */}
        <div className="flex mb-6 bg-[#0F1117] rounded-lg p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2 rounded-lg text-sm ${
              mode === "login"
                ? "bg-[#FF6633] text-white"
                : "text-gray-400"
            }`}
          >
            Login
          </button>

          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-lg text-sm ${
              mode === "signup"
                ? "bg-[#FF6633] text-white"
                : "text-gray-400"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded-lg bg-[#0F1117] text-white border border-[#2A2D3E]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <div className="relative mb-6">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-[#0F1117] text-white border border-[#2A2D3E]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Login button */}
        {mode === "login" ? (
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#FF6633] hover:bg-[#e05528] text-white py-3 rounded-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Login"
            )}
          </button>
        ) : (
          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-[#FF6633] hover:bg-[#e05528] text-white py-3 rounded-lg font-medium flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Create Account"
            )}
          </button>
        )}
      </div>
    </div>
  );
}