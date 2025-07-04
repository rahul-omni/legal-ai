import useSignup from "@/hooks/api/useAuth";
import IndividualForm from "./IndividualForm";
import OrganizationForm from "./OrganizationForm";
import { log } from "winston";

export default function SignupForm({
  signupType,
}: {
  signupType: "individual" | "organization";
}) {
  const { isLoading, error, signup } = useSignup();

  const handleSubmit = async (data: any) => {
    try {
      await signup({ ...data, signupType });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || "Signup failed" };
    }
  };

  console.log("SignupForm rendered with type:", signupType);
  

  return (
    <>
      {signupType === "individual" ? (
        <IndividualForm onSubmit={handleSubmit} isLoading={isLoading} />
      ) : (
        <OrganizationForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}
      {error && (
        <div className="mt-4 text-red-500 text-center">{error.message}</div>
      )}
    </>
  );
}
