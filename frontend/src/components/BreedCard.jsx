export default function BreedCard({ main_breed, score, info, top_3 }) {
  return (
    <div style={{ background: "#262730", padding: 20, borderRadius: 10 }}>
      <h2>
        {main_breed} • {score.toFixed(1)}%
      </h2>
      <p>Milk: {info.milk_yield}</p>
      <p>Fat: {info.fat_percentage}</p>
      <p>Value: {info.market_value}</p>

      <h4>Top 3 Matches</h4>
      <ul>
        {top_3.map((b, i) => (
          <li key={i}>
            {b.breed} - {b.score.toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  );
}
