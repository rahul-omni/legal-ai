import { useUserContext } from "@/context/userContext";
import { charFromEmail, charFromName } from "@/helper/texts";
import { LogOut } from "lucide-react";

interface GeneralSettingsProps {
  onLogout: () => void;
}

export function GeneralSettings({ onLogout }: GeneralSettingsProps) {
  const { userState } = useUserContext();
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">
        General Settings
      </h2>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500">
          {userState.user?.name
            ? charFromName(userState.user.name)
            : charFromEmail(userState.user!.email!)}
        </div>
        <div>
          <div className="text-base font-semibold text-gray-800 capitalize">
            {userState.user!.name}
          </div>
          <div className="text-sm text-gray-500">{userState.user!.email}</div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label
            htmlFor="theme"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Theme
          </label>
          <select
            id="theme"
            className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System Default</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Language
          </label>
          <select
            id="language"
            className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
          </select>
        </div>

        <div className="pt-6 mt-6 border-t">
          <h3 className="text-md font-medium text-gray-800 mb-4">Account</h3>

          <div className="flex items-center justify-between max-w-xs">
            <div>
              <h4 className="text-sm font-medium text-gray-700">Logout</h4>
              <p className="text-xs text-gray-500 mt-1">
                Sign out of your account
              </p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 hover:bg-red-100"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
