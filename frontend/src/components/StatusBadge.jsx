import React from 'react';
import { useHealth } from '../hooks/useHealth';
import { Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

const StatusBadge = ({ showDetails = false }) => {
  const { health, loading, error, refetch } = useHealth(15000);

  const isHealthy = health?.status === 'healthy';
  const isDbConnected = health?.database?.state === 'connected';

  let statusClass = 'status-badge-healthy';
  let label = 'API & DB Online';

  if (loading && !health) {
    statusClass = 'status-badge-loading';
    label = 'Connecting...';
  } else if (!isHealthy || !isDbConnected) {
    statusClass = 'status-badge-warning';
    label = isDbConnected ? 'API Degraded' : 'DB Disconnected';
  }

  return (
    <div className={`status-badge-container ${statusClass}`}>
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">{label}</span>
      </div>

      {showDetails && (
        <div className="status-details">
          <div className="status-detail-item">
            <span>Uptime:</span>
            <strong>{health?.uptime?.formatted || '--'}</strong>
          </div>
          <div className="status-detail-item">
            <span>MongoDB:</span>
            <strong className={isDbConnected ? 'text-success' : 'text-danger'}>
              {health?.database?.state || 'unknown'}
            </strong>
          </div>
          <button 
            className="status-refresh-btn" 
            onClick={refetch} 
            disabled={loading}
            title="Refresh Health Status"
          >
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      )}
    </div>
  );
};

export default StatusBadge;
