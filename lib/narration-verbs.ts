const verbs = ["investigating", "challenging", "interrogating", "auditing", "verifying"];

export function getNarrationVerb(questionCount: number) {
  return verbs[(questionCount || 0) % verbs.length];
}
