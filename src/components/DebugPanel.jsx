// Visible only with ?debug=1. Makes the server return a canned or broken
// response so each failure path can be shown on demand.
const MODES = [
  ['', 'Off — call the real model'],
  ['sample', 'Sample recipe (no API key needed)'],
  ['partial', 'Messy but salvageable output'],
  ['race', 'Random delay (submit twice fast)'],
  ['malformed', 'Malformed JSON'],
  ['wrongshape', 'Wrong shape'],
  ['empty', 'Empty response'],
  ['notfood', 'Not food'],
  ['slow', 'Too slow (8s client timeout)'],
  ['ratelimit', 'Rate limited (429)'],
  ['error500', 'Server error (500)'],
];

export default function DebugPanel({ value, onChange }) {
  return (
    <div className="debug">
      <label htmlFor="simulate" className="field-label">Test mode</label>
      <select id="simulate" value={value} onChange={(e) => onChange(e.target.value)}>
        {MODES.map(([id, label]) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
    </div>
  );
}
