function decideDirection(detectedBaseLang) {
  const d = (detectedBaseLang || "").toLowerCase();

  const baseA = baseLangFromLocale(state.pair.a);
  const baseB = baseLangFromLocale(state.pair.b);

  // If pair misconfigured, fallback safely
  if (!baseA || !baseB || baseA === "auto" || baseB === "auto") {
    return { from: state.pair.a, to: state.pair.b };
  }

  // Direct matches
  if (d === baseA) return { from: state.pair.a, to: state.pair.b };
  if (d === baseB) return { from: state.pair.b, to: state.pair.a };

  // Family-based fallback (especially Cyrillic)
  // Example: d=ru, baseA=uk -> both cyr => treat as A side (A->B)
  // Example: d=uk, baseA=ru -> both cyr => treat as A side (A->B)
  if (familyMatch(d, baseA) && !familyMatch(d, baseB)) {
    return { from: state.pair.a, to: state.pair.b };
  }
  if (familyMatch(d, baseB) && !familyMatch(d, baseA)) {
    return { from: state.pair.b, to: state.pair.a };
  }

  // If both sides are same family (e.g., ru <-> uk),
  // deterministic rule: A -> B
  if (familyMatch(d, baseA) && familyMatch(d, baseB)) {
    return { from: state.pair.a, to: state.pair.b };
  }

  // Unknown -> stable default
  return { from: state.pair.a, to: state.pair.b };
}