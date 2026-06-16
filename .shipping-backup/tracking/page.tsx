import { Suspense } from "react";
import TrackingClient from "./TrackingClient";

export const metadata = {
  title: "Track Shipment — Akanadehye Imports Global",
  description:
    "Track your container, air cargo, or road shipment in real time using your AKD tracking number or bill of lading.",
};

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading…</div>}>
      <TrackingClient />
    </Suspense>
  );
}
