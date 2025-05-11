import { useCreatePassword } from "@/hooks/api/useAuth";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { ModalButton, ModalFooter } from "../ui/ModalButton";
import { useState } from "react";

interface CreatePasswordFormInputs {
  email: string;
  password: string;
  confirmPassword: string;
}

export function CreatePasswordForm({ email }: { email: string }) {
  const { createPassword } = useCreatePassword();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const { register, handleSubmit } = useForm<CreatePasswordFormInputs>({
    defaultValues: { email },
  });

  const handleClose = () => {
    setIsOpen(false);
    toast.error("Password creation canceled");
  };

  const onSubmit: SubmitHandler<CreatePasswordFormInputs> = async (data) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const res = await createPassword(data);
    if (res?.success) {
      setIsOpen(false);
      router.replace(`${routeConfig.publicRoutes.login}?email=${data.email}`);
    }
  };

  return (
    <Modal 
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Password"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          {...register("email", { required: true })}
          type="email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          {...register("password", { required: true })}
          type="password"
          placeholder="Enter your password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <input
          {...register("confirmPassword", { required: true })}
          type="password"
          placeholder="Confirm your password"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <ModalFooter>
          <ModalButton 
            type="button" 
            variant="secondary" 
            onClick={handleClose}
          >
            Cancel
          </ModalButton>
          <ModalButton 
            type="submit"
            variant="primary"
          >
            Submit
          </ModalButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
