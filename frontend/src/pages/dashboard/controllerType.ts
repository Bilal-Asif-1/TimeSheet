import type { useDashboardController } from "./useDashboardController";

// Controller jo kuch return karta hai usi se pages ke dashboard prop ka type banta hai.
export type DashboardController = ReturnType<typeof useDashboardController>;
