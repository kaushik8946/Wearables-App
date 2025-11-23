const BarChart = () => (
  <div className="barchart-container">
    {[40, 70, 50, 90, 60, 80, 45].map((h, i) => (
      <div
        key={i}
        className="barchart-bar"
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

export default BarChart;
