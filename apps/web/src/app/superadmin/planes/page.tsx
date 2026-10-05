'use client';
import { useEffect, useState } from 'react';
import { Layers, ShieldCheck, Loader2 } from 'lucide-react';
import { useDialog } from '@/components/providers/DialogProvider';

interface PlanConfig {
  id: string;
  name: string;
  features: string; // JSON string
}

const ALL_MODULES = [
  'Ventas', 'Cobros', 'Pagos', 'Recibos', 
  'Catálogo', 'Clientes', 'Reportes', 'Integraciones', 'Configuración'
];

export default function SuperAdminPlanes() {
  const { showAlert } = useDialog();
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/superadmin/plans', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleToggleFeature = (planName: string, feature: string) => {
    setPlans(prev => prev.map(p => {
      if (p.name !== planName) return p;
      const currentFeatures: string[] = JSON.parse(p.features);
      let newFeatures;
      if (currentFeatures.includes(feature)) {
        newFeatures = currentFeatures.filter(f => f !== feature);
      } else {
        newFeatures = [...currentFeatures, feature];
      }
      return { ...p, features: JSON.stringify(newFeatures) };
    }));
  };

  const handleSave = async (planName: string) => {
    setSavingPlan(planName);
    const plan = plans.find(p => p.name === planName);
    if (!plan) return;

    try {
      const res = await fetch(`/api/superadmin/plans/${planName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: JSON.parse(plan.features) }),
        credentials: 'include'
      });
      if (res.ok) {
        showAlert('Éxito', `Configuración del plan ${planName} guardada correctamente.`, 'success');
      } else {
        showAlert('Error', 'Error al guardar configuración', 'error');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Error de red', 'error');
    } finally {
      setSavingPlan(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
        <p>Cargando planes y permisos...</p>
      </div>
    );
  }

  return (
    <>
      <header className="sa-header">
        <div>
          <h1>Gestión de Planes</h1>
          <p>Configura los módulos accesibles para cada plan</p>
        </div>
      </header>

      <div className="sa-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {plans.map(plan => {
            const enabledFeatures: string[] = JSON.parse(plan.features);
            const isPremium = plan.name === 'PREMIUM';
            
            return (
              <div key={plan.id} className="sa-panel" style={isPremium ? { borderColor: '#66FCF1', position: 'relative' } : {}}>
                {isPremium && (
                  <div style={{ position: 'absolute', top: '-10px', right: '1rem', background: '#66FCF1', color: '#0B0C10', padding: '0 0.5rem', fontWeight: 800, fontSize: '0.75rem', border: '2px solid #111827' }}>
                    RECOMENDADO
                  </div>
                )}
                <h3 className="sa-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>PLAN {plan.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>{enabledFeatures.length} MÓDULOS</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {ALL_MODULES.map(moduleName => {
                    const isEnabled = enabledFeatures.includes(moduleName);
                    return (
                      <label key={moduleName} className="sa-list-item" style={{ cursor: 'pointer' }}>
                        <span className="sa-list-name" style={{ color: isEnabled ? '#111827' : '#9CA3AF' }}>
                          {moduleName}
                        </span>
                        
                        {/* Custom Hard Toggle Switch */}
                        <div style={{
                          width: '40px',
                          height: '20px',
                          background: isEnabled ? '#111827' : '#F3F4F6',
                          border: '2px solid #111827',
                          position: 'relative',
                          transition: 'background 0.2s'
                        }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            background: isEnabled ? '#66FCF1' : '#9CA3AF',
                            position: 'absolute',
                            top: '2px',
                            left: isEnabled ? '22px' : '2px',
                            transition: 'left 0.2s',
                          }} />
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isEnabled}
                          onChange={() => handleToggleFeature(plan.name, moduleName)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    );
                  })}
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <button 
                    onClick={() => handleSave(plan.name)}
                    disabled={savingPlan === plan.name}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      border: '2px solid #111827', 
                      background: isPremium ? '#66FCF1' : '#111827', 
                      color: isPremium ? '#0B0C10' : '#FFFFFF', 
                      fontWeight: 800,
                      cursor: savingPlan === plan.name ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.5rem',
                      opacity: savingPlan === plan.name ? 0.7 : 1,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {savingPlan === plan.name ? <Loader2 size={18} className="animate-spin" /> : null}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
