import { ConvexClientProvider } from "@/lib/convex-client";
import App from "../app";

export default function Page() {
  return (
    <ConvexClientProvider>
      <App />
    </ConvexClientProvider>
  );
}
