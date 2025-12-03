## Monitoring & Health: next evolution steps

1. Extend `/api/health` in Core-API to actively probe availability of:
   - `WebKurierDroneHybrid`
   - `WebKurierChain`
   - `WebKurierSecurity`

   Probes should include:
   - **systemd state** (`systemctl is-active <service>`)
   - **HTTP hub health** (`GET <hub>/health` or fallback status)
   - **Heartbeat freshness** (`last_heartbeat age threshold`)
   - **error surface** (`details.errors if present`)

2. Expand telemetry heartbeat payload to include key dynamic metrics:
   - `fps` (frames per second in capture pipeline)
   - `latency_ms` or `rtt_ms` (transmission delay)
   - `queue_depth` (pending messages/buffers in telemetry or object queues)
   - `battery_V` / `battery_%` (telemetry-reported energy state)
   - `errors_count` (incremental error exposure)
   - `bus_contract_status` (if domain hub contracts are validated)

3. Create reliability layer for persistent monitoring state:
   - Store snapshots of board status as encrypted JSON blocks:
     `blocks/encrypted_block_XXX.json`
   - Validate integrity before storing (hash, signature or schema guard)
   - Retain history for degradation analysis and self-audit healing
   - Use this as **source of truth** for long-range board reliability promotion