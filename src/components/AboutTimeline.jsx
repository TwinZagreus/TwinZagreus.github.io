const milestones = [
  { years: "2024 — now", company: "Independent / Astral Notes", role: "Creative technologist", project: "Building quiet software with loud atmospheres. A personal lab for motion, generative visuals, and the space between a thought and a screen." },
  { years: "2021 — 2024", company: "Northstar Studio", role: "Senior interaction designer", project: "Shaped digital identities for teams working in climate, mobility, and culture. Led the visual language for a real-time cartography platform." },
  { years: "2018 — 2021", company: "Signal / Tokyo", role: "Designer & developer", project: "Turned research into tactile interfaces: installations, prototypes, and an early obsession with particles that never quite sit still." },
];

export default function AboutTimeline({ standalone = false }) {
  return (
    <section className={`about-section ${standalone ? "about-section--standalone" : ""}`} id="about">
      <div className="section-heading reveal-up">
        <div>
          <p className="eyebrow"><span>03</span> CREW LOG</p>
          <h2>A short history<br /><em>of making.</em></h2>
        </div>
        <p className="section-intro">A timeline of places, people, and projects that changed the way I look at a blank canvas.</p>
      </div>
      <div className="timeline">
        {milestones.map((milestone, index) => (
          <article className="timeline-item reveal-up" key={milestone.company} style={{ "--row-delay": `${index * 110}ms` }}>
            <div className="timeline-marker"><span>0{index + 1}</span><i /></div>
            <div className="timeline-company"><p>{milestone.years}</p><h3>{milestone.company}</h3><span>{milestone.role}</span></div>
            <div className="timeline-project"><p className="eyebrow">PROJECT / 0{index + 1}</p><p>{milestone.project}</p></div>
          </article>
        ))}
      </div>
      <div className="about-footer"><span>Available for selected collaborations</span><a href="mailto:hello@astralnotes.dev">Say hello <span>↗</span></a></div>
    </section>
  );
}
