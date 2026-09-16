const resources = [
  { category: "Library", items: ["Book renewals", "Study room booking", "Research databases"] },
  { category: "Academic Support", items: ["Tutoring center", "Writing lab", "Exam prep workshops"] },
  { category: "Career Services", items: ["Resume review", "Mock interviews", "Job board"] },
  { category: "Student Services", items: ["Counselling", "Financial aid", "Health center"] },
];

function Resources() {
  return (
    <div>
      <h1>Student Resources</h1>
      {resources.map((r) => (
        <div key={r.category} className="resource-block">
          <h2>{r.category}</h2>
          <ul>
            {r.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Resources;
