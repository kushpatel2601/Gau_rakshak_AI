import { useState } from "react";

export default function ROIcalculator({ info }) {
  const [price, setPrice] = useState(60);
  const [cost, setCost] = useState(3000);
  const milk = parseFloat(info.milk_yield) || 0;

  const profit = milk * price * 30 - cost;

  return (
    <div>
      <h3>
        {profit > 0 ? "Profit" : "Loss"}: ₹{Math.abs(profit)}
      </h3>
      <input value={price} onChange={(e) => setPrice(e.target.value)} />
      <input value={cost} onChange={(e) => setCost(e.target.value)} />
    </div>
  );
}
