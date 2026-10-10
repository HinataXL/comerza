export default function TallerDashboardLoading() {
  return (
    <div className="taller-dashboard" aria-busy="true">
      <aside className="taller-summary"><h2>Comerza Taller</h2></aside>
      <div className="taller-dashboard-content">
        <p role="status" className="taller-empty-copy">Cargando resumen del taller…</p>
        <div className="taller-widget-grid" aria-hidden="true">
          {['Cotizaciones', 'Actividad reciente', 'Estado del taller', 'Trabajos entregados'].map(title => (
            <div key={title} className="taller-card"><div className="taller-card-header"><h2>{title}</h2></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
