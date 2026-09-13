import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle2, AlertTriangle, Clock, X, FileText, UserPlus } from 'lucide-react';

const CATEGORIES = ['Villany', 'Gáz', 'Víz / Csatorna', 'Net / TV', 'Közös költség', 'Hitel', 'Streaming', 'Egyéb'];

export const BillsTab = ({
  bills,
  users,
  activeUserId,
  selectedDate,
  onAddBill,
  onToggleStatus,
  onReassignBill,
  onDeleteBill
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amountFt, setAmountFt] = useState('');
  const [dueDate, setDueDate] = useState(selectedDate);
  const [category, setCategory] = useState('Villany');
  const [assignedUser, setAssignedUser] = useState(activeUserId);
  const [note, setNote] = useState('');

  // Filter bills
  const filteredBills = bills.filter(bill => {
    const matchesUser = activeUserId === 'everyone' || bill.assignedUser === activeUserId || bill.assignedUser === 'everyone';
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesUser && matchesStatus;
  });

  // Calculate monthly stats
  const totalAmount = bills.reduce((sum, b) => sum + b.amountFt, 0);
  const paidAmount = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amountFt, 0);
  const pendingAmount = totalAmount - paidAmount;
  const overdueCount = bills.filter(b => b.status === 'overdue').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !amountFt) return;

    onAddBill({
      title: title.trim(),
      amountFt: Number(amountFt),
      dueDate,
      category,
      assignedUser,
      note: note.trim() || undefined
    });

    setTitle('');
    setAmountFt('');
    setNote('');
    setIsModalOpen(false);
  };

  const getStatusBadge = (status) => {
    if (status === 'paid') {
      return <span className="badge badge-status-paid"><CheckCircle2 size={12} /> Befizetve</span>;
    }
    if (status === 'overdue') {
      return <span className="badge badge-status-overdue"><AlertTriangle size={12} /> Késésben</span>;
    }
    return <span className="badge badge-status-pending"><Clock size={12} /> Esedékes</span>;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      {/* Header & Add Button */}
      <div className="action-header">
        <div>
          <h2>
            <CreditCard size={24} style={{ color: '#f59e0b' }} />
            Befizetnivalók & Számlák
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Fix költségek és fizetési határidők naptári nyilvántartása
          </p>
        </div>

        <button className="btn-primary" onClick={() => { setDueDate(selectedDate); setIsModalOpen(true); }}>
          <Plus size={18} />
          Új Számla
        </button>
      </div>

      {/* Monthly Financial Summary Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-glass)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Havi Fix Összesen
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {totalAmount.toLocaleString('hu-HU')} Ft
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase' }}>
            Már Befizetve
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#34d399' }}>
            {paidAmount.toLocaleString('hu-HU')} Ft
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: overdueCount > 0 ? '#f87171' : '#fbbf24', textTransform: 'uppercase' }}>
            Kifizetésre Vár
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: overdueCount > 0 ? '#f87171' : '#fbbf24' }}>
            {pendingAmount.toLocaleString('hu-HU')} Ft
          </div>
        </div>
      </div>

      {/* Status Filter Chips */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Összes számla
        </button>
        <button
          className={`filter-chip ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Esedékes
        </button>
        <button
          className={`filter-chip ${statusFilter === 'overdue' ? 'active' : ''}`}
          onClick={() => setStatusFilter('overdue')}
        >
          Késésben ({overdueCount})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'paid' ? 'active' : ''}`}
          onClick={() => setStatusFilter('paid')}
        >
          Befizetve
        </button>
      </div>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <div className="empty-state">
          <CreditCard size={40} style={{ color: 'var(--text-dim)' }} />
          <h3>Nincs megjeleníthető számla!</h3>
          <p>Rögzítsd a havi fix számlákat az "Új Számla" gombbal.</p>
        </div>
      ) : (
        <div className="items-list">
          {filteredBills.map(bill => (
            <div key={bill.id} className={`item-card ${bill.status === 'paid' ? 'completed' : ''}`}>
              <div className="item-left">
                <div className="item-details">
                  <div className="item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {bill.title}
                    {getStatusBadge(bill.status)}
                  </div>
                  <div className="item-meta">
                    <span className="badge badge-category">{bill.category}</span>
                    <span style={{ color: bill.status === 'overdue' ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                      Határidő: {bill.dueDate}
                    </span>

                    {/* User Assignment Selector */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <UserPlus size={12} style={{ color: 'var(--text-dim)' }} />
                      <select
                        value={bill.assignedUser}
                        onChange={e => onReassignBill(bill.id, e.target.value)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          color: users.find(u => u.id === bill.assignedUser)?.color || 'var(--text-main)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.4rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {bill.note && (
                      <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <FileText size={12} /> {bill.note}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="item-right">
                <div style={{ textAlign: 'right' }}>
                  <div className="item-price" style={{ color: bill.status === 'paid' ? '#34d399' : '#f59e0b' }}>
                    {bill.amountFt.toLocaleString('hu-HU')} Ft
                  </div>
                </div>

                <button
                  className={`btn-secondary`}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    background: bill.status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    borderColor: bill.status === 'paid' ? '#10b981' : '#6366f1'
                  }}
                  onClick={() => onToggleStatus(bill.id)}
                >
                  {bill.status === 'paid' ? 'Befizetve' : 'Befizetem'}
                </button>

                <button className="btn-icon" onClick={() => onDeleteBill(bill.id)} title="Törlés">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Bill Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Új Számla / Befizetnivaló</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Számla megnevezése *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. E.ON Villanyszámla, Net/TV..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Összeg (Ft) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="pl. 14500"
                    value={amountFt}
                    onChange={e => setAmountFt(e.target.value ? Number(e.target.value) : '')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fizetési Határidő *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kategória</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Felelős családtag</label>
                  <select
                    className="form-select"
                    value={assignedUser}
                    onChange={e => setAssignedUser(e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Megjegyzés / Számlaszám (opcionális)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="pl. Ügyfélazonosító, Csekk sorszáma..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Mégse
                </button>
                <button type="submit" className="btn-primary">
                  Számla Mentése
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
