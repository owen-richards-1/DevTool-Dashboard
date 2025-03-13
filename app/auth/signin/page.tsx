"use client"
import { signIn } from "next-auth/react"
import { FaGithub } from "react-icons/fa";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-md shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-black" >Sign In</h1>
        <p className="text-gray-700 mb-6">
          Please choose a sign-in method:
        </p>
        
        {/* GitHub OAuth */}
        <button onClick={() => signIn("github", { redirectTo: "/dashboard" })}
          className="w-full flex items-center justify-center gap-2 bg-black text-white rounded-md py-2 hover:bg-gray-900 transition"
        >
          <FaGithub size={20} />
          Continue with GitHub
        </button>
        
        {/* You can add more OAuth providers here */}
        
      </div>
    </main>
  );
}