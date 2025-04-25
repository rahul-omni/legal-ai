import useSignup from "@/hooks/api/useAuth";
import IndividualForm from "./IndividualForm";
import OrganizationForm from "./OrganizationForm";

export default function SignupForm({
  signupType,
}: {
  signupType: "individual" | "organization";
}) {
  const { isLoading, error, signup } = useSignup();

  const handleSubmit = async (data: any) => {
    await signup({ ...data, signupType });
  };

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
