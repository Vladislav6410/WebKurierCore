const http = require('http');
const os = require('os');

function bytesToGB(bytes) {
  return +(bytes / 1024 / 1024 / 1024).toFixed(2);
}

function sampleCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    idle += cpu.times.idle;
    total += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
  }

  return { idle, total };
}

function getCpuUsagePercent() {
  return new Promise((resolve) => {
    const start = sampleCpuTimes();
    setTimeout(() => {
      const end = sampleCpuTimes();
      const idle = end.idle - start.idle;
      const total = end.total - start.total;
      const usage = total > 0 ? (1 - idle / total) * 100 : 0;
      resolve(+usage.toFixed(2));
    }, 300);
  });
}

async function getLiveStats() {
  const cpuPercent = await getCpuUsagePercent();

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu_percent: cpuPercent,
    memory: {
      total_gb: bytesToGB(totalMem),
      used_gb: bytesToGB(usedMem),
      free_gb: bytesToGB(freeMem)
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getLiveStats
};
