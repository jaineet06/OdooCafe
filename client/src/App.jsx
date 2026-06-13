import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { CategoryProvider } from "./context/CategoryContext";
import { PosProvider } from "./context/PosContext";
import AppRoutes from "./routes/AppRoutes";
import { AppToaster } from "./components/common/AppToaster";
import { TopProgressBar } from "./components/common/TopProgressBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <CategoryProvider>
            <PosProvider>
              <TopProgressBar />
              <AppRoutes />
              <AppToaster />
            </PosProvider>
          </CategoryProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
