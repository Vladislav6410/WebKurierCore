const MonitoringAgent = require('../monitoring-agent');

test('agent initializes and creates files', () => {
  const a = new MonitoringAgent();
  expect(a).toBeTruthy();
});