import { LoadingProvider } from "@/context/loadingContext";
import { UserProvider } from "@/context/userContext";
import { AppProgressBar } from "next-nprogress-bar";
import { Toaster } from "react-hot-toast";

export const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{ success: { duration: 4000 } }}
      />
      <LoadingProvider>
        <UserProvider>
          <main>
            {children}
            <AppProgressBar
              height="4px"
              color="#fffd00"
              options={{ showSpinner: false }}
              shallowRouting
            />
          </main>
        </UserProvider>
      </LoadingProvider>
    </>
  );
};
