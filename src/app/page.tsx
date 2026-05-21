import { AppProvider } from "@/store/AppProvider";
import { AppShell } from "@/components/shared/AppShell";

export default function Home() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
