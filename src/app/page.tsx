import { UploadZone } from "@/components/upload/UploadZone";
import { DisclaimerBar } from "@/components/shared/DisclaimerBar";
import { AppProvider } from "@/store/AppProvider";

export default function Home() {
  return (
    <AppProvider>
      <UploadZone />
      <DisclaimerBar />
    </AppProvider>
  );
}
