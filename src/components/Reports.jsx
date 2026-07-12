import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export const Reports = () => {
  const { assets, allocations, bookings, maintenance, departments, employees, categories } = useContext(AppContext);
  const [exporting, setExporting] = useState(false);

  // 1. Calculate Utilization stats for Chart
  const totalCount = assets.length || 1;
  const availCount = assets.filter(a => a.status === 'Available').length;
  const allocCount = assets.filter(a => a.status === 'Allocated').length;
  const maintCount = assets.filter(a => a.status === 'Under Maintenance').length;
  const otherCount = assets.filter(a => ['Lost', 'Retired', 'Disposed'].includes(a.status)).length;

  const pctAvail = Math.round((availCount / totalCount) * 100);
  const pctAlloc = Math.round((allocCount / totalCount) * 100);
  const pctMaint = Math.round((maintCount / totalCount) * 100);
  const pctOther = Math.round((otherCount / totalCount) * 100);

  // Helper for Doughnut Chart SVG calculation
  // radius = 50, circumference = 2 * pi * r = 314
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  
  const strokeAlloc = (allocCount / totalCount) * circ;
  const strokeAvail = (availCount / totalCount) * circ;
  const strokeMaint = (maintCount / totalCount) * circ;
  const strokeOther = (otherCount / totalCount) * circ;

  const offsetAlloc = 0;
  const offsetAvail = strokeAlloc;
  const offsetMaint = strokeAlloc + strokeAvail;
  const offsetOther = strokeAlloc + strokeAvail + strokeMaint;

  // 2. Department Allocation Summaries
  const deptStats = departments.map(d => {
    const directCount = allocations.filter(al => al.status === 'active' && al.type === 'department' && al.assignedTo === d.id).length;
    // Count employees in this department
    const deptEmps = employees.filter(e => e.departmentId === d.id).map(e => e.id);
    const empCount = allocations.filter(al => al.status === 'active' && al.type === 'employee' && deptEmps.includes(al.assignedTo)).length;
    
    return {
      name: d.name,
      count: directCount + empCount
    };
  }).filter(d => d.count > 0 || d.name !== 'Marketing (Inactive)');

  const maxDeptCount = Math.max(...deptStats.map(d => d.count), 1);

  // 3. Maintenance Frequencies by Category
  const categoryMaintenanceStats = categories.map(cat => {
    const catAssets = assets.filter(a => a.categoryId === cat.id).map(a => a.id);
    const ticketCount = maintenance.filter(m => catAssets.includes(m.assetId)).length;
    return {
      id: cat.id,
      name: cat.name,
      count: ticketCount
    };
  });

  const maxMaintFreq = Math.max(...categoryMaintenanceStats.map(c => c.count), 1);

  // 4. Booking Heatmap density
  // Map hours 8am to 6pm (10 hour segments)
  const heatmapHours = Array.from({ length: 11 }, (_, i) => 8 + i);
  const sharedAssets = assets.filter(a => a.shared);

  const getHeatmapDensity = (assetId, hour) => {
    const list = bookings.filter(b => b.resourceId === assetId && b.status !== 'Cancelled');
    let hits = 0;
    list.forEach(b => {
      const sH = new Date(b.start).getHours();
      const eH = new Date(b.end).getHours();
      if (hour >= sH && hour < eH) hits += 1;
    });
    
    if (hits === 0) return 'level-0';
    if (hits === 1) return 'level-1';
    if (hits === 2) return 'level-2';
    if (hits === 3) return 'level-3';
    return 'level-4';
  };

  // 5. Assets Due for Maintenance / Nearing Retirement
  const getAssetAgeMonths = (acqDateStr) => {
    const acqDate = new Date(acqDateStr);
    const currentDate = new Date('2026-07-12');
    return (currentDate.getFullYear() - acqDate.getFullYear()) * 12 + (currentDate.getMonth() - acqDate.getMonth());
  };

  const getLifespanMonths = (catId) => {
    switch (catId) {
      case 'c-1': return 24; // Electronics - 2 years
      case 'c-2': return 36; // Furniture - 3 years
      case 'c-3': return 48; // Vehicles - 4 years
      default: return 120; // Default 10 years
    }
  };

  const activeAssets = assets.filter(a => ['Available', 'Allocated', 'Reserved', 'Under Maintenance'].includes(a.status));

  const nearingRetirementAssets = activeAssets.filter(a => {
    const age = getAssetAgeMonths(a.acquisitionDate);
    const lifespan = getLifespanMonths(a.categoryId);
    return age >= (lifespan - 6);
  });

  const dueForMaintenanceAssets = activeAssets.filter(a => {
    if (a.status === 'Under Maintenance') return false;
    if (a.condition === 'Fair' || a.condition === 'Poor') return true;
    const ticketCount = maintenance.filter(m => m.assetId === a.id).length;
    return ticketCount >= 2;
  });

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      
      // Generate mock CSV data
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Asset Tag,Asset Name,Category,Status,Location\n"
        + assets.map(e => `"${e.tag}","${e.name}","${e.categoryId}","${e.status}","${e.location}"`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `assetflow_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1200);
  };

  return (
    <div className="page-container fade-in">
      
      {/* Header and Export */}
      <div className="section-header-row">
        <h3 className="section-title">Operational Reports & Analytics</h3>
        <button className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ color: '#000' }}>
          {exporting ? 'Generating CSV...' : '📥 Export Master Asset Report'}
        </button>
      </div>

      <div className="charts-grid">
        
        {/* CHART 1: UTILIZATION DOUGHNUT */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ fontSize: '15px', marginBottom: '16px', alignSelf: 'flex-start' }}>📦 Asset Utilization Breakdown</h4>
          <div className="svg-chart-container" style={{ position: 'relative', width: '100%', height: '180px' }}>
            <svg width="180" height="180" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={radius} fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="18" />
              
              {/* Allocated */}
              {strokeAlloc > 0 && (
                <circle 
                  cx="70" cy="70" r={radius} fill="transparent" 
                  stroke="var(--color-info)" strokeWidth="18" 
                  strokeDasharray={`${strokeAlloc} ${circ}`} 
                  strokeDashoffset={-offsetAlloc}
                  transform="rotate(-90 70 70)"
                />
              )}

              {/* Available */}
              {strokeAvail > 0 && (
                <circle 
                  cx="70" cy="70" r={radius} fill="transparent" 
                  stroke="var(--color-primary)" strokeWidth="18" 
                  strokeDasharray={`${strokeAvail} ${circ}`} 
                  strokeDashoffset={-offsetAvail}
                  transform="rotate(-90 70 70)"
                />
              )}

              {/* Maintenance */}
              {strokeMaint > 0 && (
                <circle 
                  cx="70" cy="70" r={radius} fill="transparent" 
                  stroke="var(--color-warning)" strokeWidth="18" 
                  strokeDasharray={`${strokeMaint} ${circ}`} 
                  strokeDashoffset={-offsetMaint}
                  transform="rotate(-90 70 70)"
                />
              )}

              {/* Other (Lost/Retired) */}
              {strokeOther > 0 && (
                <circle 
                  cx="70" cy="70" r={radius} fill="transparent" 
                  stroke="var(--color-danger)" strokeWidth="18" 
                  strokeDasharray={`${strokeOther} ${circ}`} 
                  strokeDashoffset={-offsetOther}
                  transform="rotate(-90 70 70)"
                />
              )}
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-bright)' }}>{assets.length}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assets</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%', fontSize: '12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }}></span>
              <span>Available: <strong>{pctAvail}%</strong> ({availCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-info)' }}></span>
              <span>Allocated: <strong>{pctAlloc}%</strong> ({allocCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)' }}></span>
              <span>Maintenance: <strong>{pctMaint}%</strong> ({maintCount})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)' }}></span>
              <span>Lost/Retired: <strong>{pctOther}%</strong> ({otherCount})</span>
            </div>
          </div>
        </div>

        {/* CHART 2: DEPARTMENT ALLOCATION BAR */}
        <div className="card">
          <h4 style={{ fontSize: '15px', marginBottom: '16px' }}>🏢 Department Allocation Summary</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {deptStats.map(d => {
              const widthPct = Math.round((d.count / maxDeptCount) * 100);
              return (
                <div key={d.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>{d.name}</span>
                    <strong style={{ color: 'var(--text-bright)' }}>{d.count} Assets</strong>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${widthPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-secondary) 0%, var(--color-accent) 100%)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: MAINTENANCE FREQUENCY BY CATEGORY */}
        <div className="card">
          <h4 style={{ fontSize: '15px', marginBottom: '16px' }}>🛠️ Maintenance Frequency by Category</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {categoryMaintenanceStats.map(c => {
              const widthPct = Math.round((c.count / maxMaintFreq) * 100);
              return (
                <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>{c.name}</span>
                    <strong style={{ color: 'var(--text-bright)' }}>{c.count} Ticket(s)</strong>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${widthPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-warning) 0%, var(--color-danger) 100%)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* HEATMAP: RESOURCE BOOKING PEAK WINDOWS */}
      <div className="card">
        <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>🔥 Shared Resource Booking Heatmap (Peak hours)</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Identifies high-density reservation intervals. Grid columns represent hour blocks from 08:00 AM to 06:00 PM.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Header Row */}
          <div className="heatmap-grid" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span className="heatmap-label" style={{ fontWeight: 700 }}>Resource</span>
            {heatmapHours.map(h => (
              <span key={h} style={{ fontSize: '9px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>
                {h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`}
              </span>
            ))}
          </div>

          {/* Grid rows */}
          {sharedAssets.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No shared bookable resources registered.
            </div>
          ) : (
            sharedAssets.map(r => (
              <div key={r.id} className="heatmap-grid" style={{ alignItems: 'center' }}>
                <span className="heatmap-label" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.name}
                </span>
                {heatmapHours.map(h => (
                  <div 
                    key={h} 
                    className={`heatmap-cell ${getHeatmapDensity(r.id, h)}`}
                    title={`${r.name} at ${h}:00`}
                  ></div>
                ))}
              </div>
            ))
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', alignSelf: 'flex-end', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}></div>
              <span>0 Bookings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.4)' }}></div>
              <span>1 Booking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(16, 185, 129, 1.0)' }}></div>
              <span>Multi-booked</span>
            </div>
          </div>

        </div>
      </div>

      {/* RETIREMENT & MAINTENANCE ALERTS */}
      <div className="charts-grid" style={{ marginTop: '24px' }}>
        
        {/* Due for Maintenance */}
        <div className="card">
          <h4 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛠️ Action Required: Due for Maintenance</span>
            <span className="badge badge-warning" style={{ fontSize: '10px' }}>{dueForMaintenanceAssets.length} Flagged</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {dueForMaintenanceAssets.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No assets currently flagged for maintenance checkup.</span>
            ) : (
              dueForMaintenanceAssets.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <strong style={{ color: 'var(--text-bright)' }}>{a.name}</strong> (<code>{a.tag}</code>)
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Condition: {a.condition} | Location: {a.location}</div>
                  </div>
                  <span className="badge badge-warning" style={{ fontSize: '10px' }}>Checkup Due</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nearing Retirement */}
        <div className="card">
          <h4 style={{ fontSize: '15px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️ Lifecycle Alert: Nearing Retirement</span>
            <span className="badge badge-danger" style={{ fontSize: '10px' }}>{nearingRetirementAssets.length} Flagged</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {nearingRetirementAssets.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No active assets nearing end-of-lifecycle limits.</span>
            ) : (
              nearingRetirementAssets.map(a => {
                const ageMonths = getAssetAgeMonths(a.acquisitionDate);
                const lifespan = getLifespanMonths(a.categoryId);
                return (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.01)' }}>
                    <div>
                      <strong style={{ color: 'var(--text-bright)' }}>{a.name}</strong> (<code>{a.tag}</code>)
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Age: {Math.round(ageMonths/12*10)/10} yrs / Limit: {lifespan/12} yrs</div>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '10px' }}>Retire Soon</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      
    </div>
  );
};
