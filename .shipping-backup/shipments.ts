export type ShipmentStatus =
  | "Booked"
  | "Picked Up"
  | "At Origin Warehouse"
  | "Departed Origin"
  | "In Transit"
  | "Arrived at Port"
  | "Customs Clearance"
  | "Out for Delivery"
  | "Delivered"
  | "Exception";

export type TrackingEvent = {
  status: ShipmentStatus;
  location: string;
  timestamp: string; // ISO
  note?: string;
};

export type Shipment = {
  trackingNumber: string;
  mode: "Ocean" | "Air" | "Road";
  serviceLevel: string;
  origin: string;
  destination: string;
  shipper: string;
  consignee: string;
  pieces: number;
  weightKg: number;
  containerNo?: string;
  vesselOrFlight?: string;
  bookedAt: string;
  estimatedDelivery: string;
  currentStatus: ShipmentStatus;
  progressPct: number;
  events: TrackingEvent[];
};

// Mock data — three demo shipments at different stages
export const SHIPMENTS: Record<string, Shipment> = {
  "AKD-2026-1042": {
    trackingNumber: "AKD-2026-1042",
    mode: "Ocean",
    serviceLevel: "FCL · 40' HQ",
    origin: "Shanghai, China",
    destination: "Tema, Ghana",
    shipper: "Guangzhou Auto Parts Co.",
    consignee: "Ridge Auto Spares, Accra",
    pieces: 1,
    weightKg: 18420,
    containerNo: "MSCU-7841029",
    vesselOrFlight: "MV Maersk Halifax · Voyage 268E",
    bookedAt: "2026-04-18T08:30:00Z",
    estimatedDelivery: "2026-06-02T12:00:00Z",
    currentStatus: "In Transit",
    progressPct: 58,
    events: [
      {
        status: "Booked",
        location: "Shanghai, China",
        timestamp: "2026-04-18T08:30:00Z",
        note: "Booking confirmed — container reserved on MV Maersk Halifax.",
      },
      {
        status: "Picked Up",
        location: "Guangzhou, China",
        timestamp: "2026-04-22T14:10:00Z",
      },
      {
        status: "At Origin Warehouse",
        location: "Shanghai Yangshan Terminal",
        timestamp: "2026-04-24T09:45:00Z",
        note: "Container sealed (Seal #0042871).",
      },
      {
        status: "Departed Origin",
        location: "Shanghai, China",
        timestamp: "2026-04-28T22:00:00Z",
        note: "Vessel departed Shanghai port.",
      },
      {
        status: "In Transit",
        location: "Indian Ocean — south of Sri Lanka",
        timestamp: "2026-05-15T06:20:00Z",
        note: "On schedule. Next port: Durban.",
      },
    ],
  },
  "AKD-2026-0921": {
    trackingNumber: "AKD-2026-0921",
    mode: "Air",
    serviceLevel: "Air Express · Perishable",
    origin: "Accra, Ghana",
    destination: "London, United Kingdom",
    shipper: "Volta Lake Exports Ltd",
    consignee: "Billingsgate Fresh Market",
    pieces: 24,
    weightKg: 612,
    vesselOrFlight: "BA 0078 · Kotoka → Heathrow",
    bookedAt: "2026-05-25T05:00:00Z",
    estimatedDelivery: "2026-05-27T18:00:00Z",
    currentStatus: "Out for Delivery",
    progressPct: 92,
    events: [
      {
        status: "Booked",
        location: "Accra, Ghana",
        timestamp: "2026-05-25T05:00:00Z",
      },
      {
        status: "Picked Up",
        location: "Akosombo, Ghana",
        timestamp: "2026-05-25T11:30:00Z",
        note: "Cold-chain truck, 4°C.",
      },
      {
        status: "Departed Origin",
        location: "Kotoka Intl Airport, Accra",
        timestamp: "2026-05-26T01:15:00Z",
        note: "Flight BA 0078 departed on time.",
      },
      {
        status: "Arrived at Port",
        location: "London Heathrow",
        timestamp: "2026-05-26T08:40:00Z",
      },
      {
        status: "Customs Clearance",
        location: "Heathrow Cargo Terminal",
        timestamp: "2026-05-26T11:05:00Z",
        note: "Cleared by UK customs.",
      },
      {
        status: "Out for Delivery",
        location: "London, UK",
        timestamp: "2026-05-27T06:30:00Z",
      },
    ],
  },
  "AKD-2025-7733": {
    trackingNumber: "AKD-2025-7733",
    mode: "Ocean",
    serviceLevel: "LCL · 4.2 CBM",
    origin: "Hamburg, Germany",
    destination: "Kumasi, Ghana",
    shipper: "Bosch Werkzeuge GmbH",
    consignee: "Adum Hardware Wholesale",
    pieces: 18,
    weightKg: 1640,
    containerNo: "HLXU-2298103 (shared)",
    vesselOrFlight: "MV Hapag Antwerp · Voyage 144W",
    bookedAt: "2025-11-02T10:00:00Z",
    estimatedDelivery: "2026-01-08T16:00:00Z",
    currentStatus: "Delivered",
    progressPct: 100,
    events: [
      { status: "Booked", location: "Hamburg, Germany", timestamp: "2025-11-02T10:00:00Z" },
      { status: "Departed Origin", location: "Hamburg, Germany", timestamp: "2025-11-09T18:00:00Z" },
      { status: "Arrived at Port", location: "Tema, Ghana", timestamp: "2025-12-22T07:00:00Z" },
      { status: "Customs Clearance", location: "Tema, Ghana", timestamp: "2025-12-29T15:30:00Z" },
      { status: "Out for Delivery", location: "Kumasi, Ghana", timestamp: "2026-01-08T08:00:00Z" },
      { status: "Delivered", location: "Adum, Kumasi", timestamp: "2026-01-08T14:22:00Z", note: "Signed by Mr. K. Boateng." },
    ],
  },
};

export function findShipment(code: string): Shipment | null {
  return SHIPMENTS[code.trim().toUpperCase()] ?? null;
}
