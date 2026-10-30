"use client";

import { useEffect } from "react";
import { track } from "@/lib/tracking";

export function BookingStartTracker() {
  useEffect(() => {
    track("booking_start");
  }, []);

  return null;
}
