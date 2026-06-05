import React, { useEffect, useState } from "react";
import { AuthTabs } from "@/components/AuthTabs";
import { CheckCircle2 } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { consumeAuthRedirect } from "@/services/authRedirect";
import { nigeriaStates } from "@/constants/nigeriaStates";
import { toast } from "react-toastify";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
 
  const [avatar, setAvatar] = useState<File | null>(null);


  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    verifyPassword: "",
    username: "",
    dob: "",
    phone: "",
    state: "",
    referralCode: "",
  });

//   const search = useSearch({ from: "/register" });

// useEffect(() => {
//   if (search.ref && !form.referralCode) {
//     setForm((prev) => ({
//       ...prev,
//       referralCode: search.ref,
//     }));

//     toast.success("Referral code applied 🎁");
//   }
// }, [search.ref]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ✅ ONLY LOGIC ADDED HERE
  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  const {
    firstName,
    lastName,
    email,
    password,
    verifyPassword,
    username,
    dob,
    phone,
    state,
    referralCode,
  } = form;

  // validation
  if (!email || !password || !firstName || !lastName || !username || !dob || !phone || !state) {
    toast.error("Please fill required fields");
    return;
  }

  if (password !== verifyPassword) {
    toast.error("Passwords do not match");
    return;
  }

  try {
    setLoading(true);

    await register({
      firstName,
      lastName,
      username,
      email,
      password,
      dob,
      phone,
      state,
      referralCode,
      avatar,
    });

    toast.success("Account created successfully 🎉");

    navigate({
      to: consumeAuthRedirect() || "/dashboard",
      replace: true,
    });
  } catch (err: unknown) {
    toast.error(getErrorMessage(err, "Registration failed"));
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-4 py-5 text-foreground">
      <div className="mx-auto w-full max-w-md">
        {/* Top Tabs */}
        <AuthTabs active="register" />

        {/* Form */}
        <form onSubmit={handleRegister} className="mt-12 space-y-4">
          {/* First + Last Name */}
          <div className="grid grid-cols-2 gap-3 ">
            <InputField
              placeholder="First Name"
              value={form.firstName}
              required
              onChange={(v) => updateField("firstName", v)}
            />
            <InputField
              placeholder="Last Name"
              value={form.lastName}
              required
              onChange={(v) => updateField("lastName", v)}
            />
          </div>

          {/* Email */}
          <InputField
            placeholder="Email"
            type="email"
            value={form.email}
            required
            onChange={(v) => updateField("email", v)}
          />

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              placeholder="Password"
              type="password"
              value={form.password}
              required
              onChange={(v) => updateField("password", v)}
            />

            {/* Verify Password */}
            <InputField
              placeholder="Verify Password"
              type="password"
              value={form.verifyPassword}
              onChange={(v) => updateField("verifyPassword", v)}
            />
          </div>

          {/* Username + DOB */}
          <div className="grid grid-cols-2 gap-3">
            <InputField
              placeholder="Username"
              value={form.username}
              required
              onChange={(v) => updateField("username", v)}
            />

            <InputField
              placeholder="Date of Birth"
              type="date"
              value={form.dob}
              required
              onChange={(v) => updateField("dob", v)}
            />
          </div>

          {/* Phone + Verified */}

          <div className="relative">
            <InputField
              placeholder="Phone Number"
              value={form.phone}
              type="tel"
              required
              onChange={(v) => updateField("phone", v)}
            />

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-[10px] text-black font-medium">Verified</span>

              <CheckCircle2 className="h-5 w-5 fill-lime-400 text-whit drop-shadow-sm" />
            </div>
          </div>

          <InputField
            placeholder="Referral Code (optional)"
            value={form.referralCode}
            onChange={(v) => updateField("referralCode", v)}
          />

          <select
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
            required
            className="h-12 w-full rounded-full bg-white px-5 text-sm text-black outline-none"
          >
            <option value="" className="text-gray-400">
              Select State
            </option>

            {nigeriaStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-400 pl-4 mb-2">
            Add Profile Picture
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
            className="block w-full cursor-pointer rounded-full bg-white text-sm text-black file:mr-4 file:h-12 file:border-0 file:bg-blue-600 file:px-5 file:text-sm file:font-semibold file:text-white"
          />


          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 h-14 w-full  rounded-full bg-blue-600 text-white font-semibold text-sm tracking-wide hover:bg-blue-500 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>
    </main>
  );
};

type InputProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  full?: boolean;
  required?: boolean;
};

function InputField({ placeholder, value, onChange, type = "text", required = false }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-12 w-full rounded-full bg-white px-5 text-sm text-black placeholder:text-gray-400 outline-none"
    />
  );
}

export default Register;
