// v1 stub. Replace with Chain signing.
export function signJob(job) {
  // signature must exist and look non-empty for WDA verify stub
  return {
    ...job,
    signature: `stub_${Date.now()}_${Math.random().toString(16).slice(2)}`
  };
}