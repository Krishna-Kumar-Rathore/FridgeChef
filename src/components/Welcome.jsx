const EXAMPLES = [
  'eggs, spinach, half an onion, feta',
  'leftover rice, frozen peas, soy sauce, 2 eggs',
  'chickpeas, tomatoes, garlic, yogurt, cumin',
  'paneer, capsicum, onion, tomato, garam masala',
];

export default function Welcome({ onPick }) {
  return (
    <section className="welcome">
      <h2>Nothing cooking yet</h2>
      <p>
        List what you have on the left. You'll get a recipe you can scale, swap ingredients in, and tick off step by
        step while you cook. Your recipes are saved on this device.
      </p>
      <p className="welcome-try">Not sure what to type? Start from one of these:</p>
      <ul className="examples">
        {EXAMPLES.map((ex) => (
          <li key={ex}>
            <button className="example" onClick={() => onPick(ex)}>{ex}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
