import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';

export const ResourceBooking = () => {
  const { 
    assets, 
    bookings, 
    employees, 
    bookResource, 
    cancelBooking, 
    rescheduleBooking,
    checkBookingOverlap,
    addNotification,
    currentUser
  } = useContext(AppContext);

  const role = currentUser?.role || 'Employee';

  const sharedResources = assets.filter(a => a.shared && a.status === 'Available');

  // Selected state
  const [selectedResourceId, setSelectedResourceId] = useState(sharedResources[0]?.id || '');
  const [bookingDate, setBookingDate] = useState('2026-07-12'); // Current mock date

  // Form states
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [bookingNotes, setBookingNotes] = useState('');
  
  // Status/Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reschedule Modal States
  const [showReschedModal, setShowReschedModal] = useState(false);
  const [reschedBooking, setReschedBooking] = useState(null);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedStart, setReschedStart] = useState('09:00');
  const [reschedEnd, setReschedEnd] = useState('10:00');
  const [reschedError, setReschedError] = useState('');

  const selectedResource = assets.find(r => r.id === selectedResourceId);

  const handleOpenReschedule = (booking) => {
    setReschedBooking(booking);
    setReschedDate(booking.start.split('T')[0]);
    
    // Extract times in local format
    const sDate = new Date(booking.start);
    const eDate = new Date(booking.end);
    const sHStr = String(sDate.getHours()).padStart(2, '0');
    const sMStr = String(sDate.getMinutes()).padStart(2, '0');
    const eHStr = String(eDate.getHours()).padStart(2, '0');
    const eMStr = String(eDate.getMinutes()).padStart(2, '0');

    setReschedStart(`${sHStr}:${sMStr}`);
    setReschedEnd(`${eHStr}:${eMStr}`);
    setReschedError('');
    setShowReschedModal(true);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    setReschedError('');
    setErrorMsg('');
    setSuccessMsg('');

    const startIso = `${reschedDate}T${reschedStart}:00`;
    const endIso = `${reschedDate}T${reschedEnd}:00`;

    if (new Date(startIso) >= new Date(endIso)) {
      setReschedError('Error: End time must be after start time.');
      return;
    }

    const res = rescheduleBooking(reschedBooking.id, startIso, endIso);
    if (res.success) {
      setSuccessMsg('Booking rescheduled successfully!');
      setShowReschedModal(false);
    } else {
      setReschedError(res.message);
    }
  };
  
  // Filter bookings for selected resource and date
  const resourceBookings = bookings.filter(b => {
    if (b.resourceId !== selectedResourceId) return false;
    // Extract date from ISO string
    const bDate = b.start.split('T')[0];
    return bDate === bookingDate;
  });

  const getEmployeeName = (id) => employees.find(e => e.id === id)?.name || 'Unknown';

  const handleBookSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Combine date and time
    const startIso = `${bookingDate}T${startTime}:00`;
    const endIso = `${bookingDate}T${endTime}:00`;

    if (new Date(startIso) >= new Date(endIso)) {
      setErrorMsg('Error: End time must be after start time.');
      return;
    }

    const res = bookResource(selectedResourceId, startIso, endIso, bookingNotes);
    if (res.success) {
      setSuccessMsg('Booking reserved successfully!');
      setBookingNotes('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSendReminder = (booking) => {
    const resourceName = assets.find(r => r.id === booking.resourceId)?.name || 'Resource';
    addNotification(
      'Upcoming Booking Reminder', 
      `Reminder: Your booking for ${resourceName} starts at ${new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`, 
      'warning'
    );
    setSuccessMsg('Mock start reminder notification dispatched!');
  };

  // Helper: Generates hour slots for visual timeline (08:00 to 18:00)
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i); // 8, 9, ..., 18

  const checkSlotStatus = (hour) => {
    // Returns booking if this hour is covered by an active booking
    return resourceBookings.find(b => {
      if (b.status === 'Cancelled') return false;
      const bStartHour = new Date(b.start).getHours();
      const bEndHour = new Date(b.end).getHours();
      const bStartMin = new Date(b.start).getMinutes();
      const bEndMin = new Date(b.end).getMinutes();

      const hourStart = hour;
      const hourEnd = hour + 1;
      
      const bStartVal = bStartHour + (bStartMin / 60);
      const bValEnd = bEndHour + (bEndMin / 60);

      // Overlaps hour segment
      return (bStartVal < hourEnd && bValEnd > hourStart);
    });
  };

  return (
    <div className="page-container fade-in">
      
      {errorMsg && (
        <div style={{ padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          {successMsg}
        </div>
      )}

      <div className="calendar-view-container">
        
        {/* Left Side: Controls & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>📅 Selection</h3>
            <div className="form-group">
              <label className="form-label">Shared Resource</label>
              <select 
                className="form-select" 
                value={selectedResourceId} 
                onChange={(e) => setSelectedResourceId(e.target.value)}
              >
                {sharedResources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.location})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Booking Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={bookingDate} 
                onChange={(e) => setBookingDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>🕒 Book Time Slot</h3>
            <form onSubmit={handleBookSubmit}>
              <div className="form-grid" style={{ marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <select className="form-select" value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                    <option value="08:00">08:00 AM</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <select className="form-select" value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Booking Notes</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g. Department sync meeting"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '10px', color: '#000' }}
                disabled={!selectedResourceId}
              >
                Reserve Slot
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Timeline & Bookings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Visual Hour Timeline */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>📊 Timeline Schedule: {bookingDate}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hours.map(hour => {
                const bookedItem = checkSlotStatus(hour);
                const isBooked = !!bookedItem;
                const formattedHour = hour > 12 ? `${hour - 12}:00 PM` : hour === 12 ? '12:00 PM' : `${hour}:00 AM`;

                return (
                  <div 
                    key={hour} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '10px 14px', 
                      borderRadius: '6px', 
                      background: isBooked ? 'var(--color-secondary-light)' : 'rgba(255, 255, 255, 0.02)',
                      borderLeft: `4px solid ${isBooked ? 'var(--color-secondary)' : 'var(--border-color)'}`,
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ width: '90px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {formattedHour}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      {isBooked ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{bookedItem.notes || 'Reserved Slot'}</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>
                              by {getEmployeeName(bookedItem.bookedBy)}
                            </span>
                          </div>
                          <span className="badge badge-secondary" style={{ fontSize: '10px', padding: '1px 6px' }}>Booked</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Open Slot Available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table list of bookings */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: '16px' }}>🗃️ Scheduled Bookings for Day</h3>
            {resourceBookings.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No active bookings on this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resourceBookings.map(b => {
                  const sTime = new Date(b.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const eTime = new Date(b.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={b.id} style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)', 
                      background: 'rgba(255,255,255,0.01)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
                        <div>
                          <strong>{sTime} - {eTime}</strong>
                          <span className={`badge ${b.status === 'Cancelled' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '9px', marginLeft: '8px', padding: '1px 6px' }}>
                            {b.status}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          Reserved by: <strong>{getEmployeeName(b.bookedBy)}</strong> | Notes: {b.notes || '-'}
                        </div>
                      </div>
                      
                      {b.status === 'Upcoming' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--color-warning)' }}
                            onClick={() => handleSendReminder(b)}
                          >
                            🔔 Remind
                          </button>
                          {(currentUser?.id === b.bookedBy || role === 'Admin') && (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid var(--color-primary)' }}
                                onClick={() => handleOpenReschedule(b)}
                              >
                                ✏️ Reschedule
                              </button>
                              <button 
                                className="btn btn-danger" 
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => cancelBooking(b.id)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RESCHEDULE BOOKING MODAL --- */}
      {showReschedModal && reschedBooking && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Reschedule Reservation</h3>
              <button className="close-btn" onClick={() => setShowReschedModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRescheduleSubmit}>
              <div className="modal-body">
                {reschedError && <div style={{ color: 'var(--color-danger)', fontSize: '13px', marginBottom: '12px' }}>{reschedError}</div>}
                
                <div style={{ marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                    Resource: {assets.find(r => r.id === reschedBooking.resourceId)?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Current schedule: {new Date(reschedBooking.start).toLocaleString()} ➔ {new Date(reschedBooking.end).toLocaleString()}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Booking Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={reschedDate} 
                    onChange={(e) => setReschedDate(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">New Start Time</label>
                    <select className="form-select" value={reschedStart} onChange={(e) => setReschedStart(e.target.value)}>
                      <option value="08:00">08:00 AM</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="17:00">05:00 PM</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New End Time</label>
                    <select className="form-select" value={reschedEnd} onChange={(e) => setReschedEnd(e.target.value)}>
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="17:00">05:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReschedModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ color: '#000' }}>Confirm Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
