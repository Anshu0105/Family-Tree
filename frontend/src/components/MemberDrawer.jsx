import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { X, Save, Pencil, Check, AlertCircle } from 'lucide-react';
import { API_BASE } from '../config';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function genderClass(gender) {
  if (gender === 'Male') return 'male';
  if (gender === 'Female') return 'female';
  return 'neutral';
}

const EMPTY_FORM = {
  name: '',
  nickname: '',
  gender: '',
  details: {
    phone: '',
    email: '',
    address: '',
    dob: '',
    marriageDate: '',
    qualification: '',
    profession: '',
    dateOfDeath: '',
    bloodGroup: ''
  }
};

function memberToForm(member) {
  return {
    name: member.name || '',
    nickname: member.nickname || '',
    gender: member.gender || '',
    details: {
      phone: member.details?.phone || '',
      email: member.details?.email || '',
      address: member.details?.address || '',
      dob: member.details?.dob || '',
      marriageDate: member.details?.marriageDate || '',
      qualification: member.details?.qualification || '',
      profession: member.details?.profession || '',
      dateOfDeath: member.details?.dateOfDeath || '',
      bloodGroup: member.details?.bloodGroup || ''
    }
  };
}

export default function MemberDrawer({ member, isOpen, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);   // eslint-disable-line no-unused-vars
  const [photoPreview, setPhotoPreview] = useState(null);
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const photoInputRef = useRef(null);

  // Map gender to the same accent colours used in MemberNode
  const GENDER_COLORS = {
    Male:   { ring: '#3b82f6', bg: '#2563eb' },
    Female: { ring: '#ec4899', bg: '#be185d' },
  };
  const DEFAULT_COLORS = { ring: '#9ca3af', bg: '#6b7280' };

  useEffect(() => {
    if (member) {
      setFormData(memberToForm(member));
      setIsEditing(false);
      setSaveSuccess(false);
      setSaveError(null);
      // Reset photo preview when switching members
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [member?._id, isOpen]);

  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    previousFocusRef.current = document.activeElement;
    const drawer = drawerRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      [...drawer.querySelectorAll(focusableSelector)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    const focusFirst = () => {
      const focusable = getFocusable();
      focusable[0]?.focus();
    };

    const t = setTimeout(focusFirst, 50);

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    drawer.addEventListener('keydown', handleTab);
    return () => {
      clearTimeout(t);
      drawer.removeEventListener('keydown', handleTab);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, isEditing]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setFormData(memberToForm(member));
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, isEditing, member, onClose]);

  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['name', 'nickname', 'gender'].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, details: { ...prev.details, [name]: value } }));
    }
  };

  const handleCancelEdit = useCallback(() => {
    setFormData(memberToForm(member));
    setIsEditing(false);
  }, [member]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous object URL to avoid memory leaks
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPhotoFile(file);
    // TODO: upload photoFile to backend when storage is configured
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await axios.put(`${API_BASE}/${member._id}`, formData);
      onUpdate(response.data);
      setIsEditing(false);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Failed to update member', err);
      setSaveError('Failed to save details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !member) return null;

  const gClass = genderClass(formData.gender);

  const renderField = (label, value) => (
    <div className="info-group">
      <div className="info-label">{label}</div>
      <div className={`info-value ${!value ? 'empty' : ''}`}>
        {value || 'Not provided'}
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={`drawer ${isOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-member-name"
      >
        {saveSuccess && (
          <div className="drawer-success" role="status">
            <Check size={16} aria-hidden="true" />
            Changes saved
          </div>
        )}

        <div className="drawer-profile">
          <div className="drawer-profile-top">
            <div className="drawer-profile-row">
              {/* ── Photo upload avatar ─────────────────────────── */}
              <div className="drawer-photo-upload">
                <div
                  className="drawer-photo-circle"
                  style={{
                    borderColor: (GENDER_COLORS[formData.gender] || DEFAULT_COLORS).ring,
                    background:  photoPreview ? 'transparent' : (GENDER_COLORS[formData.gender] || DEFAULT_COLORS).bg,
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt={`${formData.name || 'Member'} photo`}
                      className="drawer-photo-img"
                    />
                  ) : (
                    <span style={{ color: '#fff', fontSize: 26, fontWeight: 700, lineHeight: 1 }}>
                      {getInitials(formData.name)}
                    </span>
                  )}
                </div>
                {/* Hidden file input */}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  aria-label="Upload member photo"
                  onChange={handlePhotoChange}
                />
                <button
                  type="button"
                  className="drawer-photo-btn"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
              </div>
              <div className="drawer-profile-info">
                <h2 id="drawer-member-name">{formData.name || 'Unknown'}</h2>
                {formData.nickname && <div className="drawer-nickname">{formData.nickname}</div>}
                {formData.gender && <span className="drawer-gender-pill">{formData.gender}</span>}
              </div>
            </div>
            <div className="drawer-header-actions">
              {!isEditing && (
                <button
                  className="icon-btn icon-btn-edit"
                  onClick={() => setIsEditing(true)}
                  type="button"
                  aria-label="Edit member"
                >
                  <Pencil size={16} /> Edit
                </button>
              )}
              <button
                className="icon-btn"
                onClick={onClose}
                type="button"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="drawer-content">
          {saveError && (
            <div className="drawer-error" role="alert">
              <AlertCircle size={16} aria-hidden="true" />
              <span>{saveError}</span>
            </div>
          )}
          {isEditing ? (
            <div className="edit-form">
              <div className="form-section">
                <div className="form-section-title">Identity</div>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nickname">Nickname</label>
                    <input id="nickname" type="text" name="nickname" value={formData.nickname} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="gender">Gender</label>
                    <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="">Unspecified</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Contact</div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" type="tel" name="phone" value={formData.details.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" name="email" value={formData.details.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input id="address" type="text" name="address" value={formData.details.address} onChange={handleChange} />
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Life events</div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dob">Date of birth</label>
                    <input id="dob" type="date" name="dob" value={formData.details.dob} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="marriageDate">Marriage date</label>
                    <input id="marriageDate" type="date" name="marriageDate" value={formData.details.marriageDate} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bloodGroup">Blood Group</label>
                    <input id="bloodGroup" type="text" name="bloodGroup" value={formData.details.bloodGroup} onChange={handleChange} placeholder="e.g. A+, O-, B+" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="qualification">Qualification</label>
                    <input id="qualification" type="text" name="qualification" value={formData.details.qualification} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profession">Profession</label>
                    <input id="profession" type="text" name="profession" value={formData.details.profession} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group form-group-death">
                  <label htmlFor="dateOfDeath">Date of death</label>
                  <input id="dateOfDeath" type="date" name="dateOfDeath" value={formData.details.dateOfDeath} onChange={handleChange} />
                </div>
              </div>

              <div className="drawer-footer drawer-footer-actions">
                <button className="btn-secondary" onClick={handleCancelEdit} type="button" disabled={saving}>
                  Cancel
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving} type="button">
                  <Save size={16} />
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="drawer-section">
                <div className="drawer-section-title">Contact</div>
                <div className="info-grid">
                  {renderField('Phone', formData.details.phone)}
                  {renderField('Email', formData.details.email)}
                  {renderField('Address', formData.details.address)}
                </div>
              </div>
              <div className="drawer-section">
                <div className="drawer-section-title">Life events</div>
                <div className="info-grid">
                  {renderField('Date of birth', formData.details.dob)}
                  {renderField('Blood Group', formData.details.bloodGroup)}
                  {renderField('Marriage date', formData.details.marriageDate)}
                  {renderField('Qualification', formData.details.qualification)}
                  {renderField('Profession', formData.details.profession)}
                  {renderField('Date of death', formData.details.dateOfDeath)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
