export function isTargetWithinProjectScope(projectTargetUrl: string, requestedTargetUrl: string) {
  try {
    return new URL(projectTargetUrl).origin === new URL(requestedTargetUrl).origin;
  } catch {
    return false;
  }
}
