import { Suspense } from "react";
import StaffLoginClient from "./StaffLoginClient";

export default function Page() {
  return (
    <Suspense>
      <StaffLoginClient />
    </Suspense>
  );
}