import { useForm } from "react-hook-form";
// import { zodResolver } from '@hookform/resolvers/zod';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  orgName: z.string().min(1, "Organization name is required"),
  adminName: z.string().min(1, "Admin name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export default function OrganizationForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="rounded-md shadow-sm space-y-4">
        <div>
          <label htmlFor="orgName" className="sr-only">
            Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            {...register("orgName")}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Organization name"
          />
          {errors.orgName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.orgName.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="adminName" className="sr-only">
            Admin Name
          </label>
          <input
            id="adminName"
            type="text"
            {...register("adminName")}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Admin name"
          />
          {errors.adminName && (
            <p className="mt-1 text-sm text-red-600">
              {errors.adminName.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>
      <button
        className="w-full bg-primary text-white py-2 rounded hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? "Creating organization..." : "Sign up as Organization"}
      </button>
    </form>
  );
}
