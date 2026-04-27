import React from 'react'
import { useState } from "react";
import { AuthTabs } from "@/components/AuthTabs";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from '@tanstack/react-router';

const Register = () => {
  const navigate = useNavigate();
 
   const [form, setForm] = useState({
     firstName: "",
     lastName: "",
     email: "",
     password: "",
     verifyPassword: "",
     username: "",
     dob: "",
     phone: "",
   });
 
   const updateField = (key: string, value: string) => {
     setForm((prev) => ({ ...prev, [key]: value }));
   };
 
   return (
     <main className="h-full bg-black text-white px-4 pt-12">
       <div className="mx-auto w-full max-w-sm ">
         {/* Top Tabs */}
         <AuthTabs active="register" />
 
         {/* Form */}
         <form
           onSubmit={(e) => {
             e.preventDefault();
             navigate({ to: "/login" });
           }}
           className="mt-12 space-y-4"
         >
           {/* First + Last Name */}
           <div className="grid grid-cols-2 gap-3 ">
             <InputField
               placeholder="First Name"
               value={form.firstName}
               onChange={(v) => updateField("firstName", v)}
             />
             <InputField
               placeholder="Last Name"
               value={form.lastName}
               onChange={(v) => updateField("lastName", v)}
             />
           </div>
 
           {/* Email */}
           <InputField
             placeholder="Email"
             value={form.email}
             onChange={(v) => updateField("email", v)}
             full
           />
 
           {/* Password */}
           <InputField
             placeholder="Password"
             type="password"
             value={form.password}
             onChange={(v) => updateField("password", v)}
             full
           />
 
           {/* Verify Password */}
           <InputField
             placeholder="Verify Password"
             type="password"
             value={form.verifyPassword}
             onChange={(v) => updateField("verifyPassword", v)}
             full
           />
 
           {/* Username + DOB */}
           <div className="grid grid-cols-2 gap-3">
             <InputField
               placeholder="Username"
               value={form.username}
               onChange={(v) => updateField("username", v)}
             />
             <InputField
               placeholder="Date of Birth"
               value={form.dob}
               onChange={(v) => updateField("dob", v)}
             />
           </div>
 
           {/* Phone + Verified */}
           <div className="relative">
             <InputField
               placeholder="Phone Number"
               value={form.phone}
               onChange={(v) => updateField("phone", v)}
               full
             />
           
 
           <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <span className="text-[10px] text-black font-medium">Verified</span>
 
             <CheckCircle2 className="h-5 w-5 fill-lime-400 text-whit drop-shadow-sm" />
           </div>
           </div>
 
           {/* Register Button */}
           <button
             type="submit"
             className="mt-4 h-14 w-full  rounded-full bg-blue-600 text-white font-semibold text-sm tracking-wide hover:bg-blue-500 transition"
           >
             Register
           </button>
         </form>
       </div>
     </main>
   );
 }
 
 type InputProps = {
   placeholder: string;
   value: string;
   onChange: (value: string) => void;
   type?: string;
   full?: boolean;
 };
 
 function InputField({ placeholder, value, onChange, type = "text" }: InputProps) {
   return (
     <input
       type={type}
       value={value}
       onChange={(e) => onChange(e.target.value)}
       placeholder={placeholder}
       className="h-12 w-full rounded-full bg-white px-5 text-sm text-black placeholder:text-gray-400 outline-none"
     />
   );
 }
 

export default Register
