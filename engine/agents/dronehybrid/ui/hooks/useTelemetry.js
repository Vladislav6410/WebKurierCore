import { useEffect, useState } from "react";
import { connectTelemetryWs } from "../api.js";

export function useTelemetry() {
  const [telemetry, setTelemetry] = useState({
    altitude: 0,
    speed: 0,
    battery: 0,
    gps: "—",
    heading: 0,
  });

  useEffect(() => {
    const ws = connectTelemetryWs((msg) => {
      if (msg?.type === "telemetry" && msg?.data) setTelemetry(msg.data);
    });

    return () => ws?.close?.();
  }, []);

  return telemetry;
}