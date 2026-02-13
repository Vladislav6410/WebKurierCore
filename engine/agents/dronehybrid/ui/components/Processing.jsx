import React, { useEffect, useState } from "react";
import { listMissions, getMission, startProcessing, getApiBase } from "../api.js";

export default function Processing() {
  const [missions, setMissions] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const API_BASE = getApiBase();

  async function refreshList() {
    const data = await listMissions();
    setMissions(data.items || []);
    if (!selectedId && (data.items || []).length) setSelectedId(data.items[0].id);
  }

  async function refreshSelected(id) {
    if (!id) return;
    const m = await getMission(id);
    setSelected(m);
  }

  useEffect(() => { refreshList(); }, []);
  useEffect(() => { refreshSelected(selectedId); }, [selectedId]);

  async function run(type) {
    if (!selectedId) return;
    setBusy(true);
    try {
      await startProcessing(selectedId, type);
      // poll a bit (mock completes fast)
      setTimeout(() => refreshSelected(selectedId), 1500);
    } finally {
      setBusy(false);
    }
  }

  const outputs = selected?.processing?.outputs || {};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-semibold">Пост-обработка</h2>

          <div className="flex items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} • {m.status}
                </option>
              ))}
            </select>

            <button
              onClick={() => refreshSelected(selectedId)}
              className="border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50"
            >
              Обновить
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => run("ortho")}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-60"
          >
            Ortho
          </button>
          <button
            disabled={busy}
            onClick={() => run("dsm")}
            className="bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-60"
          >
            DSM
          </button>
          <button
            disabled={busy}
            onClick={() => run("model")}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-60"
          >
            3D Model
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["ortho", "dsm", "model"].map((k) => {
            const item = outputs?.[k];
            const preview = item?.previewUrl;
            const url = item?.url ? `${API_BASE}${item.url}` : null;

            return (
              <div key={k} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">
                  {k === "ortho" ? "Ортофото" : k === "dsm" ? "ЦМР (DSM)" : "3D Модель"}
                </h3>

                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {preview ? (
                    <img src={preview} alt={k} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm">Нет результата</span>
                  )}
                </div>

                <div className="mt-3">
                  {url ? (
                    <a className="text-blue-600 hover:underline text-sm" href={url} target="_blank" rel="noreferrer">
                      Скачать результат
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}