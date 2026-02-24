import { Suspense } from "react";
import OwnerDashboardClient from "./OwnerDashboardClient";

export default function Page() {
  return (
    <Suspense>
      <OwnerDashboardClient />
    </Suspense>
  );
}
