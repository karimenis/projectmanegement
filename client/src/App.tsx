import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import { loadMockData } from "./lib/storage";

function Router() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize mock data in localStorage when app loads
    loadMockData();
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Chargement de l'application...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
