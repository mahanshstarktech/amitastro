import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  Check, 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth, type BirthProfile } from '../../context/AuthContext';
import { useCountry } from '../../context/CountryContext';
import { apiRequest } from '../../utils/api';
import { PlanBadge } from '../common/PlanBadge';
import { FamilyUpgradeModal } from './FamilyUpgradeModal';

interface SubscriptionData {
  plan: string;
  planBadge: string;
  isFamilySubscriber: boolean;
  familySlots: {
    total: number;
    used: number;
    remaining: number;
    profiles: any[];
  };
  subscription: {
    status: string;
    autopayEnabled: boolean;
    expiresAt: string | null;
    daysRemaining: number;
    amount: number;
    currency: string;
    mandateReference: string | null;
    currentPeriodStart: string | null;
    nextBillingAt: string | null;
  };
}

interface SubscriptionManagementViewProps {
  onOpenBooking?: () => void;
  onOpenAddProfile?: () => void;
  onOpenUpgrade?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const SubscriptionManagementView: React.FC<SubscriptionManagementViewProps> = ({
  onOpenBooking = () => {},
  onOpenAddProfile = () => {},
  onOpenUpgrade,
  onNavigateTab
}) => {
  const { user, profiles, refreshMe } = useAuth();
  const { countryInfo } = useCountry();

  const [subData, setSubData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingAutopay, setIsTogglingAutopay] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<SubscriptionData>('/subscription/my');
      setSubData(res);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [user?.id, profiles.length]);

  const handleToggleAutopay = async () => {
    if (!subData) return;
    const nextState = !subData.subscription.autopayEnabled;
    setIsTogglingAutopay(true);
    setActionMessage(null);

    try {
      const res = await apiRequest<{ success: boolean; autopayEnabled: boolean; message: string }>('/subscription/autopay', {
        method: 'PATCH',
        body: JSON.stringify({ autopay: nextState })
      });

      setSubData((prev) =>
        prev
          ? {
              ...prev,
              subscription: {
                ...prev.subscription,
                autopayEnabled: res.autopayEnabled
              }
            }
          : null
      );
      setActionMessage({ type: 'success', text: res.message });
      await refreshMe();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update autopay state.' });
    } finally {
      setIsTogglingAutopay(false);
    }
  };

  const isFamily = user?.isFamilySubscriber || subData?.isFamilySubscriber || user?.role === 'admin';
  const familyPricing = countryInfo.prices.family || {
    amount: 100000,
    formatted: '₹1,00,000 / yr',
    label: '1-Year Unlimited Family 360 Plan'
  };

  const familyMembers = profiles.filter((p) => p.relation !== 'self');
  const slotsUsed = familyMembers.length;
  const slotsTotal = 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Action Notification */}
      {actionMessage && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: 14,
            backgroundColor: actionMessage.type === 'success' ? '#F0FDF4' : '#FFF1F2',
            border: `1px solid ${actionMessage.type === 'success' ? '#86EFAC' : '#FECDD3'}`,
            color: actionMessage.type === 'success' ? '#166534' : '#9F1239',
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Status Hero Card */}
      <div
        className="apple-card"
        style={{
          padding: '28px 24px',
          background: isFamily
            ? 'linear-gradient(135deg, #FAF5FF 0%, #F5E8FF 50%, #EDE9FE 100%)'
            : '#FFFFFF',
          border: isFamily ? '2px solid #D8B4FE' : '1px solid #E5E5EA',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <PlanBadge
                badge={user?.role === 'admin' ? 'Admin' : (user?.planBadge || 'Free(Trial)')}
                size="md"
              />
              {isFamily ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    padding: '3px 10px',
                    borderRadius: 999,
                    border: '1px solid #A7F3D0'
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  Active Membership
                </span>
              ) : (
                <span style={{ fontSize: 13, color: '#6E6E73', fontWeight: 600 }}>
                  One-Time Pay Plan
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em', marginBottom: 6 }}>
              {isFamily ? 'Family 360 Royal Pass (Annual)' : 'Upgrade to Family 360 Plan'}
            </h2>
            <p style={{ fontSize: 14.5, color: '#4B5563', maxWidth: 540, lineHeight: 1.5 }}>
              {isFamily
                ? 'Your household has full VIP access with unlimited consultations, 4 family member profiles, and direct astrologer priority.'
                : `Subscribe for ${familyPricing.formatted} to unlock 1 full year of unlimited consultations and add up to 4 family members under one account.`}
            </p>
          </div>

          <div>
            {isFamily ? (
              <button
                onClick={onOpenBooking}
                className="apple-btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #7928CA, #FF0080)',
                  border: 'none',
                  padding: '12px 22px',
                  fontSize: 14.5,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(121, 40, 202, 0.35)'
                }}
              >
                <Calendar size={16} /> Book Free VIP Consultation
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="apple-btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #7928CA, #FF0080)',
                  border: 'none',
                  padding: '12px 22px',
                  fontSize: 14.5,
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(121, 40, 202, 0.35)'
                }}
              >
                <Crown size={16} /> Upgrade to Family 360 ({familyPricing.formatted})
              </button>
            )}
          </div>
        </div>

        {/* Expiry & Days Countdown for Active Subscribers */}
        {isFamily && subData?.subscription?.expiresAt && (
          <div
            style={{
              marginTop: 22,
              paddingTop: 18,
              borderTop: '1px solid rgba(216, 180, 254, 0.6)',
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              fontSize: 13.5
            }}
          >
            <div>
              <span style={{ color: '#6B7280', fontSize: 12, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Valid Until
              </span>
              <strong style={{ color: '#1D1D1F', fontSize: 15 }}>
                {new Date(subData.subscription.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </strong>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontSize: 12, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Days Remaining
              </span>
              <strong style={{ color: '#7928CA', fontSize: 15 }}>
                {subData.subscription.daysRemaining} Days of Unlimited Consultations
              </strong>
            </div>
            <div>
              <span style={{ color: '#6B7280', fontSize: 12, display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                Billing Cycle
              </span>
              <strong style={{ color: '#1D1D1F', fontSize: 15 }}>
                Annual (365 Days)
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Netflix-Style Autopay Control Card (Exclusive to Subscribers) */}
      {isFamily && (
        <div
          className="apple-card"
          style={{
            padding: '24px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E5EA',
            borderRadius: 20
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <RefreshCw size={18} color="#7928CA" />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F' }}>
                  Netflix-Style Recurring Autopay
                </h3>
              </div>
              <p style={{ fontSize: 13.5, color: '#6E6E73', maxWidth: 520, lineHeight: 1.45 }}>
                {subData?.subscription?.autopayEnabled
                  ? 'Autopay is currently active. Your annual membership will automatically renew so your household never loses uninterrupted access.'
                  : 'Autopay is currently paused. Your subscription will remain fully active until the expiration date and will not renew automatically.'}
              </p>
            </div>

            <button
              onClick={handleToggleAutopay}
              disabled={isTogglingAutopay}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 999,
                backgroundColor: subData?.subscription?.autopayEnabled ? '#F5F3FF' : '#F4F4F5',
                border: `1.5px solid ${subData?.subscription?.autopayEnabled ? '#C084FC' : '#D4D4D8'}`,
                cursor: isTogglingAutopay ? 'wait' : 'pointer',
                fontWeight: 700,
                fontSize: 14,
                color: subData?.subscription?.autopayEnabled ? '#7928CA' : '#52525B',
                transition: 'all 0.2s ease'
              }}
            >
              {subData?.subscription?.autopayEnabled ? (
                <>
                  <ToggleRight size={24} color="#7928CA" />
                  <span>Autopay Enabled (Click to Pause)</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={24} color="#71717A" />
                  <span>Autopay Paused (Click to Enable)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Family Member Slots Grid (Upto 4 Members) */}
      <div
        className="apple-card"
        style={{
          padding: '26px 24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5EA',
          borderRadius: 20
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Users size={18} color="#3A3A6E" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F' }}>
                Family Member Profiles ({slotsUsed} / {slotsTotal} Slots Used)
              </h3>
            </div>
            <p style={{ fontSize: 13.5, color: '#6E6E73' }}>
              Family 360 includes up to 4 family members (spouse, children, parents) with dedicated Kundli & Dasha charts.
            </p>
          </div>

          {isFamily ? (
            slotsUsed < slotsTotal && (
              <button
                onClick={onOpenAddProfile}
                className="apple-btn-secondary"
                style={{ fontSize: 13.5, padding: '8px 16px', color: '#7928CA', borderColor: '#D8B4FE' }}
              >
                <Plus size={15} /> Add Family Member ({slotsTotal - slotsUsed} slots left)
              </button>
            )
          ) : (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="apple-btn-secondary"
              style={{ fontSize: 13.5, padding: '8px 16px', color: '#7928CA', borderColor: '#D8B4FE' }}
            >
              <Crown size={15} /> Unlock 4 Family Slots
            </button>
          )}
        </div>

        {/* 4 Slots Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((slotIndex) => {
            const member = familyMembers[slotIndex];
            if (member) {
              return (
                <div
                  key={member.id}
                  style={{
                    backgroundColor: '#FAF5FF',
                    border: '1.5px solid #E9D5FF',
                    borderRadius: 16,
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7928CA', backgroundColor: '#EDE9FE', padding: '2px 8px', borderRadius: 999 }}>
                        SLOT #{slotIndex + 1} · {member.relation.toUpperCase()}
                      </span>
                      <Check size={14} color="#10B981" />
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1D1D1F', marginBottom: 4 }}>
                      {member.full_name}
                    </h4>
                    <div style={{ fontSize: 12.5, color: '#6B7280', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div>DOB: <strong>{member.dob}</strong> ({member.tob})</div>
                      <div>Place: <strong>{member.pob}</strong></div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`empty-slot-${slotIndex}`}
                style={{
                  border: '1.5px dashed #D1D5DB',
                  borderRadius: 16,
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 120,
                  backgroundColor: '#FAFAFA',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 4 }}>
                  SLOT #{slotIndex + 1} (EMPTY)
                </div>
                {isFamily ? (
                  <button
                    onClick={onOpenAddProfile}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7928CA',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Plus size={14} /> Add Member
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                    Available on Family 360 Plan
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Feature Comparison Table */}
      <div
        className="apple-card"
        style={{
          padding: '26px 24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5EA',
          borderRadius: 20
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1D1D1F', marginBottom: 16 }}>
          Plan Comparison & Features
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #E5E5EA', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', color: '#6E6E73', fontWeight: 600 }}>Feature</th>
                <th style={{ padding: '10px 12px', color: '#6E6E73', fontWeight: 600 }}>Free / Trial</th>
                <th style={{ padding: '10px 12px', color: '#6E6E73', fontWeight: 600 }}>One-Time Plans (Lite/Plus/Pro)</th>
                <th style={{ padding: '10px 12px', color: '#7928CA', fontWeight: 700 }}>Family 360 (Annual Autopay)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Consultations Included', free: '5-Minute Discovery Call', onetime: '1 Session per Booking', family: 'UNLIMITED (365 Days)' },
                { name: 'Family Member Profiles', free: 'Self Only (1)', onetime: 'Self Only (1)', family: 'Upto 4 Family Members' },
                { name: 'VIP Direct Hotline', free: 'No', onetime: 'Followup Chat (3-7d)', family: 'Dedicated Priority Hotline' },
                { name: 'Kundli & Dasha Breakdown', free: 'Basic Highlight', onetime: 'Single Individual', family: 'For Entire Household' },
                { name: 'Annual Vastu & Remedies', free: 'No', onetime: 'PDF Report (Pro Only)', family: 'Full Ongoing Annual Roadmap' },
                { name: 'Pricing Model', free: '₹0 (Trial)', onetime: 'Pay Per Session', family: `${familyPricing.formatted} (Autopay)` }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#1D1D1F' }}>{row.name}</td>
                  <td style={{ padding: '12px', color: '#6E6E73' }}>{row.free}</td>
                  <td style={{ padding: '12px', color: '#4B5563' }}>{row.onetime}</td>
                  <td style={{ padding: '12px', color: '#7928CA', fontWeight: 700, backgroundColor: '#FAF5FF' }}>{row.family}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      <FamilyUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          setShowUpgradeModal(false);
          loadSubscription();
        }}
      />
    </div>
  );
};
