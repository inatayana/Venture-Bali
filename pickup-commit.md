feat(booking): update pickup zones and vehicle classes for ATV private transfer

- Pickup zones: Core Area +Rp 500,000/vehicle, South Zone 1 +Rp 700,000/vehicle,
  South Zone 2 +Rp 800,000/vehicle; Outer Area disabled with
  "Not Available / Read Only" label.
- Vehicle classes: Standard SUV up to 5 pax included (Rp 0), Premium MPV up to 6 pax
  +Rp 400,000, Minivan up to 14 pax +Rp 1,000,000.
- UI: zone dropdown disables outer area with new label.
- Tests: updated core zone surcharge expectation to match new per-vehicle pricing.
