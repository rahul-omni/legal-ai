import LegalEditor from "@/components/LegalEditor";
import { FileHandlingProvider } from "@/context/fileHandlingContext";

export default function Home() {
  return (
    <main>
      <FileHandlingProvider>
        <LegalEditor />
      </FileHandlingProvider>
    </main>
  );
}
