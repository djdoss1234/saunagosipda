import { Home } from "@/components/Home";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
