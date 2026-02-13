import React from "react";
import { useTelemetry } from "./useTelemetry.js";

const STATUS_PLANNED = "planned";
const STATUS_IN_PROGRESS = "in-progress";
const STATUS_COMPLETED = "completed";

export default function Dashboard({ missions = [] }) {
  const telemetry = useTelemetry();

  const activeCount = missions.filter(
    (m) => m.status === STATUS_PLANNED || m.status === STATUS_IN_PROGRESS
  ).length;

  const completedCount = missions.filter(
    (m) => m.status === STATUS_COMPLETED
  ).length;

  const totalPhotos = missions.reduce(
    (sum, m) => sum + (Number(m.photos) || 0),
    0
  );

  const coverageKm2 = missions.reduce(
    (sum, m) => sum + (Number(m.areaKm2) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Активные миссии"
          value={activeCount}
          color="border-blue-500"
        />
        <DashboardCard
          title="Обработано"
          value={completedCount}
          color="border-green-500"
        />
        <DashboardCard
          title="Снимки"
          value={totalPhotos.toLocaleString()}
          color="border-purple-500"
        />
        <DashboardCard
          title="Покрытие"
          value={`${coverageKm2.toFixed(2)} км²`}
          color="border-orange-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Телеметрия в реальном времени</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <TelemetryItem label="Высота" value={`${telemetry.altitude.toFixed(1)} м`} />
          <TelemetryItem label="Скорость" value={`${telemetry.speed.toFixed(1)} м/с`} />
          <TelemetryItem label="Батарея" value={`${telemetry.battery.toFixed(0)}%`} />
          <TelemetryItem label="GPS" value={telemetry.gps} />
          <TelemetryItem label="Курс" value={`${telemetry.heading.toFixed(0)}°`} />
        </div>
      </div>
    </div>
  );
}

const DashboardCard = ({ title, value, color }) => (
  <div className={`bg-white rounded-lg shadow-md p-6 ${color}`}>
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

const TelemetryItem = ({ label, value }) => (
  <div className="text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-lg font-bold">{value}</p>
  </div>
);