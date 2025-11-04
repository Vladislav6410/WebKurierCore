exports.parseGitHubEvent = (event, payload) => {
  if (event === 'workflow_run') {
    const name = payload.workflow?.name || payload.workflow_run?.name;
    const concl = payload.workflow_run?.conclusion;
    if (concl === 'failure' || concl === 'timed_out' || concl === 'cancelled') {
      return {
        source: 'github',
        type: `workflow_${concl}`,
        message: `${name}: ${concl}`,
        severity: concl === 'failure' ? 'critical' : 'warning'
      };
    }
    return null;
  }
  if (event === 'repository_vulnerability_alert') {
    return {
      source: 'github',
      type: 'security_alert',
      message: `${payload.alert?.affected_package_name} ${payload.action}`,
      severity: 'critical'
    };
  }
  if (event === 'issues' && payload.action === 'opened') {
    return {
      source: 'github',
      type: 'issue_opened',
      message: `#${payload.issue.number} ${payload.issue.title}`,
      severity: 'warning'
    };
  }
  // при необходимости добавить check_run, deployment_status и пр.
  return null;
};