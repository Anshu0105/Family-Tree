import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Edit2, Trash2, UserPlus, Heart, Baby } from 'lucide-react';
import { isDeceased } from '../utils/memberMeta';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function getYearRange(details) {
  if (!details?.dob) return null;
  const dob = new Date(details.dob);
  if (isNaN(dob.getTime())) return null;
  const birthYear = dob.getFullYear();
  if (details.dateOfDeath) {
    const dod = new Date(details.dateOfDeath);
    if (!isNaN(dod.getTime())) return `${birthYear} – ${dod.getFullYear()}`;
  }
  return `${birthYear} – Present`;
}

const GENDER_COLORS = {
  Male:   { ring: '#3b82f6', bg: '#2563eb' },
  Female: { ring: '#ec4899', bg: '#be185d' },
};
const DEFAULT_COLORS = { ring: '#9ca3af', bg: '#6b7280' };

const MemberNode = ({ data }) => {
  const deceased = isDeceased(data.details);
  const yearRange = getYearRange(data.details);
  const { ring, bg } = GENDER_COLORS[data.gender] || DEFAULT_COLORS;

  return (
    <div
      className={`member-node ${data.isActive ? 'active' : ''} ${deceased ? 'deceased' : ''}`}
      aria-current={data.isActive ? 'true' : undefined}
    >
      {/* Top connection handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ opacity: 0, pointerEvents: 'none' }}
        isConnectable={false}
      />

      {/* Circular avatar */}
      <div className="node-avatar-ring" style={{ borderColor: ring }}>
        <div
          className="node-avatar-fill"
          style={{
            background: bg,
            filter: deceased ? 'grayscale(0.8) brightness(0.85)' : 'none',
          }}
        >
          <span className="node-avatar-initials">{getInitials(data.name)}</span>
        </div>
        {deceased && (
          <span className="node-dagger" aria-label="Deceased">†</span>
        )}
      </div>

      {/* Name and year range */}
      <div className="node-info">
        <p className="node-name">{data.name || 'Unknown'}</p>
        {yearRange && <p className="node-years">{yearRange}</p>}
      </div>

      {/* Quick-add buttons — float below node when active */}
      {data.isActive && (
        <div className="quick-add-container">
          <button
            className="quick-btn"
            type="button"
            aria-label="Add father"
            onClick={(e) => { e.stopPropagation(); data.onAddParent(data._id, 'Male'); }}
          >
            <UserPlus size={10} /> Father
          </button>
          <button
            className="quick-btn"
            type="button"
            aria-label="Add mother"
            onClick={(e) => { e.stopPropagation(); data.onAddParent(data._id, 'Female'); }}
          >
            <UserPlus size={10} /> Mother
          </button>
          <button
            className="quick-btn"
            type="button"
            aria-label="Add spouse"
            onClick={(e) => { e.stopPropagation(); data.onAddSpouse(data._id); }}
          >
            <Heart size={10} /> Spouse
          </button>
          <button
            className="quick-btn"
            type="button"
            aria-label="Add child"
            onClick={(e) => { e.stopPropagation(); data.onAddChild(data._id); }}
          >
            <Baby size={10} /> Child
          </button>
        </div>
      )}

      {/* Bottom / side handles */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="children"
        style={{ opacity: 0, pointerEvents: 'none' }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse"
        style={{ top: 28, opacity: 0, pointerEvents: 'none' }}
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-in"
        style={{ top: 28, opacity: 0, pointerEvents: 'none' }}
        isConnectable={false}
      />

      {/* Edit / Delete controls */}
      <div className="node-controls">
        <button
          className="ctrl-btn edit-btn"
          type="button"
          onClick={(e) => { e.stopPropagation(); data.onEdit(data); }}
          title="Edit details"
          aria-label={`Edit ${data.name || 'member'}`}
        >
          <Edit2 size={13} />
        </button>
        <button
          className="ctrl-btn delete-btn"
          type="button"
          onClick={(e) => { e.stopPropagation(); data.onDelete(data._id, data.name); }}
          title="Delete member"
          aria-label={`Delete ${data.name || 'member'}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default memo(MemberNode);
