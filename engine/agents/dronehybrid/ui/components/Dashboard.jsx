import React from "react";
import { useTelemetry } from "../hooks/useTelemetry.js";

export default function Dashboard({ missions }) {
  const telemetry = useTelemetry();

  const activeCount = (missions || []).filter(m => m.status === "planned" || m.status === "in-progress" || m.status === "in_progress").length;
  const completedCount = (missions || []).filter(m => m.status === "completed").length;
  const totalPhotos = (missions || []).reduce((s, m) => s + (Number(m.photos) || 0), 0);
  const coverageKm2 = (missions || []).reduce((s, m) => s + (Number(m.areaKm2) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Активные миссии</h3>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Обработано</h3>
          <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Снимки</h3>
          <p className="text-2xl font-bold text-gray-900">{totalPhotos.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-500">Покрытие</h3>
          <p className="text-2xl font-bold text-gray-900">{coverageKm2.toFixed(2)} км²</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Телеметрия в реальном времени</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Высота</p>
            <p className="text-lg font-bold">{telemetry.altitude.toFixed(1)} м</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Скорость</p>
            <p className="text-lg font-bold">{telemetry.speed.toFixed(1)} м/с</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Батарея</p>
            <p className="text-lg font-bold">{telemetry.battery.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">GPS</p>
            <p className="text-lg font-bold">{telemetry.gps}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Курс</p>
            <p className="text-lg font-bold">{telemetry.heading.toFixed(0)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
}