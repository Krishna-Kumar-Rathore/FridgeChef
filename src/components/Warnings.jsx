// The AI's answer sometimes needs fixing (we fill gaps, drop broken items).
// We say so instead of hiding it, but keep it out of the way.
export default function Warnings({ warnings }) {
  if (!warnings?.length) return null;
  return (
    <details className="warnings">
      <summary>
        {warnings.length === 1 ? '1 note about this recipe' : `${warnings.length} notes about this recipe`}
      </summary>
      <ul>
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </details>
  );
}
