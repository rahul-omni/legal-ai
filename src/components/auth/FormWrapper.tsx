import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function FormWrapper({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
        </div>
        {children}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => router.push(routeConfig.publicRoutes[0])} // Assuming the signup page is the second public route
              className="text-primary hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
