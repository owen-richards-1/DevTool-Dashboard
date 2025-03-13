// app/profile/page.tsx
import { auth } from "@/auth";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";

export default async function ProfilePage() {
  const session: Session | null = await auth();

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Please sign in to view your profile.
        </p>
      </div>
    );
  }

  // Destructure user information from the session
  const { name, email, image } = session.user
  // Since we use GitHub as the provider, we display static info for the provider and scopes
  const provider = "GitHub";
  // These scopes match what you requested in your NextAuth config
  const authorizedScopes = "read:user, repo";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-900 p-10">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg">
        {/* User Info */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          {image && (
            <Image
              src={image}
              alt={`${name}'s profile picture`}
              width={120}
              height={120}
              className="rounded-full border-4 border-indigo-500"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {name}
            </h1>
            <p className="text-gray-700 dark:text-gray-300">{email}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Signed in with <span className="font-semibold">{provider}</span>
            </p>
          </div>
        </div>

        {/* Authorization Details */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authorization Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Provider:</span> {provider}
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Authorized Scopes:</span> {authorizedScopes}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Your account is authorized to perform actions such as starring and forking repositories, and accessing your GitHub profile details.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg transition"
          >
            Go to Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}