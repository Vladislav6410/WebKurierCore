import {
  getStatus,
  getTelemetry,
  getActionLog,
  verifyChain,
  buildMission,
  validateMission,
  uploadMission,
  sendAction,
  issueMissionCertificate,
  getMissionCertificate
} from "../api/mission-api.js";


let currentCertificate = null;
let rawActionLogItems = [];
let actionLogItems = [];


/* -----------------------------
STATUS
----------------------------- */

function setStatus(text) {
  const el = document.getElementById("statusText");
  if (el) el.textContent = text;
}


/* -----------------------------
CERTIFICATE PREVIEW
----------------------------- */

function setCertificatePreview(data) {
  const el = document.getElementById("certificatePreview");

  if (!el) return;

  el.textContent = JSON.stringify(data ?? {}, null, 2);
}


/* -----------------------------
VERIFY RESULT
----------------------------- */

function setCertificateVerifyResult(ok, text) {

  const box = document.getElementById("certificateVerifyBox");

  if (!box) return;

  box.classList.remove("ok", "bad");

  if (ok === true) box.classList.add("ok");
  if (ok === false) box.classList.add("bad");

  box.innerHTML = `<div class="tail-verify-line">${text}</div>`;
}


/* -----------------------------
FORM COLLECT
----------------------------- */

function collectCertificateForm() {

  return {
    mission_id: document.getElementById("certificateMissionId")?.value?.trim(),

    drone_id: document.getElementById("certificateDroneId")?.value?.trim(),

    operator_id: document.getElementById("certificateOperatorId")?.value?.trim(),

    start_time: document.getElementById("certificateStartTime")?.value?.trim(),

    end_time: document.getElementById("certificateEndTime")?.value?.trim(),

    record_hashes: rawActionLogItems
      .map(item => item.record_hash)
      .filter(Boolean)
  };

}


function getCurrentMissionId() {
  return document.getElementById("certificateMissionId")?.value?.trim();
}


/* -----------------------------
ISSUE CERTIFICATE
----------------------------- */

async function issueCertificate() {

  try {

    const payload = collectCertificateForm();

    if (!payload.mission_id) {

      setStatus("mission_id пустой");
      return;

    }

    if (!payload.record_hashes.length) {

      setStatus("нет record_hashes для сертификата");
      return;

    }

    setStatus("выпускаю сертификат...");

    const result = await issueMissionCertificate(payload);

    currentCertificate = result.certificate || result;

    setCertificatePreview(currentCertificate);

    setStatus(`сертификат выпущен: ${currentCertificate.mission_id}`);

    setCertificateVerifyResult(null, "certificate verify: not checked");

  }
  catch (error) {

    setStatus(`ошибка issue certificate: ${error.message}`);

  }

}


/* -----------------------------
VIEW CERTIFICATE
----------------------------- */

async function viewCertificate() {

  try {

    const missionId = getCurrentMissionId();

    if (!missionId) {

      setStatus("mission_id пустой");
      return;

    }

    setStatus("загружаю сертификат...");

    const certificate = await getMissionCertificate(missionId);

    currentCertificate = certificate;

    setCertificatePreview(currentCertificate);

    setStatus(`сертификат загружен: ${missionId}`);

  }
  catch (error) {

    setStatus(`ошибка view certificate: ${error.message}`);

  }

}


/* -----------------------------
COPY CERTIFICATE
----------------------------- */

async function copyCertificateJson() {

  try {

    if (!currentCertificate) {

      setStatus("сначала откройте или выпустите сертификат");
      return;

    }

    await navigator.clipboard.writeText(
      JSON.stringify(currentCertificate, null, 2)
    );

    setStatus("certificate json скопирован");

  }
  catch (error) {

    setStatus(`ошибка copy certificate: ${error.message}`);

  }

}


/* -----------------------------
EXPORT CERTIFICATE
----------------------------- */

async function exportCertificateJson() {

  try {

    if (!currentCertificate) {

      setStatus("сначала откройте или выпустите сертификат");
      return;

    }

    const blob = new Blob(
      [JSON.stringify(currentCertificate, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `${currentCertificate.mission_id || "mission_certificate"}.json`;

    document.body.appendChild(a);

    a.click();

    a.remove();

    URL.revokeObjectURL(url);

    setStatus("certificate json экспортирован");

  }
  catch (error) {

    setStatus(`ошибка export certificate: ${error.message}`);

  }

}


/* -----------------------------
CANONICAL PAYLOAD
----------------------------- */

function canonicalCertificatePayload(cert) {

  return JSON.stringify(
    {
      certificate_type: cert.certificate_type ?? null,
      certificate_version: cert.certificate_version ?? null,
      mission_id: cert.mission_id ?? null,
      drone_id: cert.drone_id ?? null,
      operator_id: cert.operator_id ?? null,
      start_time: cert.start_time ?? null,
      end_time: cert.end_time ?? null,
      records_count: cert.records_count ?? null,
      merkle_root: cert.merkle_root ?? null,
      issued_at: cert.issued_at ?? null,
      issuer: cert.issuer ?? null
    },
    [
      "certificate_type",
      "certificate_version",
      "mission_id",
      "drone_id",
      "operator_id",
      "start_time",
      "end_time",
      "records_count",
      "merkle_root",
      "issued_at",
      "issuer"
    ]
  );

}


/* -----------------------------
VERIFY CERTIFICATE
----------------------------- */

async function verifyCertificate() {

  try {

    if (!currentCertificate) {

      setStatus("сначала откройте или выпустите сертификат");
      return;

    }

    if (!currentCertificate.signature) {

      setCertificateVerifyResult(false, "certificate verify: signature missing");
      return;

    }

    if (!currentCertificate.merkle_root) {

      setCertificateVerifyResult(false, "certificate verify: merkle_root missing");
      return;

    }

    const basicOk =
      !!currentCertificate.mission_id &&
      !!currentCertificate.drone_id &&
      !!currentCertificate.operator_id &&
      !!currentCertificate.start_time &&
      !!currentCertificate.end_time &&
      (
        Number.isInteger(currentCertificate.records_count) ||
        typeof currentCertificate.records_count === "number"
      );

    if (!basicOk) {

      setCertificateVerifyResult(false, "certificate verify: required fields invalid");

      return;

    }

    setCertificateVerifyResult(
      true,
      `certificate verify: STRUCTURE OK | mission: ${currentCertificate.mission_id} | records: ${currentCertificate.records_count}`
    );

    setStatus("certificate verify завершён");

  }
  catch (error) {

    setCertificateVerifyResult(false, `certificate verify error: ${error.message}`);

    setStatus(`ошибка verify certificate: ${error.message}`);

  }

}


/* -----------------------------
EXPORT FUNCTIONS
----------------------------- */

window.issueCertificate = issueCertificate;
window.viewCertificate = viewCertificate;
window.copyCertificateJson = copyCertificateJson;
window.exportCertificateJson = exportCertificateJson;
window.verifyCertificate = verifyCertificate;