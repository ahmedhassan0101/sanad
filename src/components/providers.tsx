
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { DirectionProvider } from "@/components/ui/direction";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <DirectionProvider direction="rtl">
        {children}
        <Toaster />
      </DirectionProvider>
    </ThemeProvider>
  );
}