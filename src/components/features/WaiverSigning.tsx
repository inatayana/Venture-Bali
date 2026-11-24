'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

import { AlertCircle, CheckCircle, Loader2, PenTool, FileText, X, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { WAIVER_SECTIONS, WAIVER_VERSION } from '@/lib/legal';
import { formatPrice } from '@/lib/i18n';

interface WaiverSigningProps {
  bookingId: string;
  accessToken: string;
}

interface HealthDeclaration {
  noAlcohol: boolean;
  noDrugs: boolean;
  noImpairingMeds: boolean;
  disclosedConditions: string[];
  mobilityOk: boolean;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface WaiverData {
  digitalSignature: string; // base64
  signatureMethod: 'draw' | 'type';
  healthDeclaration: HealthDeclaration;
  emergencyContact: EmergencyContact;
  idVerified: boolean;
  photoId?: string; // base64
  signedBy: string;
}

const DEFAULT_HEALTH: HealthDeclaration = {
  noAlcohol: false,
  noDrugs: false,
  noImpairingMeds: false,
  disclosedConditions: [],
  mobilityOk: true,
};

const DEFAULT_EMERGENCY: EmergencyContact = {
  name: '',
  phone: '',
  relation: '',
};

export function WaiverSigningPage({ bookingId, accessToken }: WaiverSigningProps) {
  const searchParams = useSearchParams();
  const access = accessToken || searchParams.get('access') || searchParams.get('token');

  const [booking, setBooking] = useState<{
    id: string;
    bookingCode: string;
    bookingDate: string;
    slotTime?: string;
    variant: {
      title: string;
      venture: { title: string; location: string; meetingPoint?: string };
      fulfillmentMode: string;
    };
    paxCount: number;
    totalPrice: number;
    paymentStatus: string;
    lifecycleStatus: string;
    waiverAcceptedAt?: string;
    waiverVersion?: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'health' | 'emergency' | 'id' | 'sign' | 'complete'>('review');
  const [waiverData, setWaiverData] = useState<WaiverData>({
    digitalSignature: '',
    signatureMethod: 'draw',
    healthDeclaration: DEFAULT_HEALTH,
    emergencyContact: DEFAULT_EMERGENCY,
    idVerified: false,
    photoId: undefined,
    signedBy: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Photo ID
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Fetch booking
  useEffect(() => {
    if (!access) {
      setError('Invalid or missing access token');
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/booking/${bookingId}?access=${encodeURIComponent(access)}`);
        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Failed to load booking');
        }
        setBooking(payload.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId, access]);

  // Canvas drawing handlers
  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    if (!point) return;
    setIsDrawing(true);
    setLastPoint(point);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;
    const point = getCanvasPoint(e);
    if (!point) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setLastPoint(point);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
    if (canvasRef.current) {
      setWaiverData(prev => ({ ...prev, digitalSignature: canvasRef.current!.toDataURL('image/png'), signatureMethod: 'draw' }));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setWaiverData(prev => ({ ...prev, digitalSignature: '', signatureMethod: 'draw' }));
  };

  const handleTypedSignature = (name: string) => {
    setWaiverData(prev => ({ ...prev, digitalSignature: name, signatureMethod: 'type', signedBy: name }));
  };

  // Photo ID handlers
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPhotoPreview(base64);
      setWaiverData(prev => ({ ...prev, photoId: base64, idVerified: true }));
      setSubmitError(null);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setWaiverData(prev => ({ ...prev, photoId: undefined, idVerified: false }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Health declaration handlers
  const toggleHealth = (field: keyof HealthDeclaration, value: boolean) => {
    setWaiverData(prev => ({
      ...prev,
      healthDeclaration: { ...prev.healthDeclaration, [field]: value },
    }));
  };

  const toggleCondition = (condition: string) => {
    setWaiverData(prev => ({
      ...prev,
      healthDeclaration: {
        ...prev.healthDeclaration,
        disclosedConditions: prev.healthDeclaration.disclosedConditions.includes(condition)
          ? prev.healthDeclaration.disclosedConditions.filter(c => c !== condition)
          : [...prev.healthDeclaration.disclosedConditions, condition],
      },
    }));
  };

  // Emergency contact handlers
  const updateEmergency = (field: keyof EmergencyContact, value: string) => {
    setWaiverData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value },
    }));
  };

  // Step navigation
  const nextStep = () => {
    if (step === 'review') setStep('health');
    else if (step === 'health') setStep('emergency');
    else if (step === 'emergency') setStep('id');
    else if (step === 'id') setStep('sign');
    else if (step === 'sign') setStep('complete');
  };

  const prevStep = () => {
    if (step === 'health') setStep('review');
    else if (step === 'emergency') setStep('health');
    else if (step === 'id') setStep('emergency');
    else if (step === 'sign') setStep('id');
  };

  const isStepValid = () => {
    switch (step) {
      case 'review': return true;
      case 'health': return waiverData.healthDeclaration.noAlcohol && waiverData.healthDeclaration.noDrugs && waiverData.healthDeclaration.noImpairingMeds && waiverData.healthDeclaration.mobilityOk;
      case 'emergency': return waiverData.emergencyContact.name.trim() && waiverData.emergencyContact.phone.trim() && waiverData.emergencyContact.relation.trim();
      case 'id': return waiverData.idVerified && waiverData.photoId;
      case 'sign': return waiverData.digitalSignature.length > 0 && waiverData.signedBy.trim();
      case 'complete': return false;
      default: return false;
    }
  };

  // Submit waiver
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/booking/${bookingId}/waiver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(access && { 'X-Booking-Access': access }),
        },
        body: JSON.stringify({
          ...waiverData,
          waiverVersion: WAIVER_VERSION,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Failed to submit waiver');
      }

      setStep('complete');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit waiver');
    } finally {
      setSubmitting(false);
    }
  };

  // Canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
          <p className="mt-4 text-neutral-600">Loading your booking...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
          <h1 className="text-xl font-bold text-neutral-900">Unable to load waiver</h1>
          <p className="mt-2 text-sm text-neutral-600">{error}</p>
          <Link href="/" className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white">
            Back to adventures
          </Link>
        </div>
      </main>
    );
  }

  if (!booking) return null;

  const steps = ['review', 'health', 'emergency', 'id', 'sign', 'complete'] as const;
  const stepLabels = ['Review', 'Health', 'Emergency', 'ID', 'Sign', 'Complete'];
  const currentStepIndex = steps.indexOf(step);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (step === 'complete') {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-12">
        <div className="container mx-auto max-w-2xl">
          <div className="text-center py-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-neutral-900 dark:text-white">Waiver Signed</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Your safety waiver has been recorded for booking <strong>{booking.bookingCode}</strong>.
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-white/10">
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">Next Steps</h3>
            <ul className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Waiver recorded with timestamp and version <code>{WAIVER_VERSION}</code></li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Digital signature captured</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Health declaration & emergency contact recorded</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> ID verification complete</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Vendor copy will be sent to the activity operator</li>
            </ul>
            <div className="mt-6">
              <Link
                href={`/voucher/${bookingId}?access=${encodeURIComponent(access || '')}`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900"
              >
                View your voucher
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* Progress Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200 dark:border-white/10 dark:bg-neutral-950/95">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {booking.variant.venture.title} — {booking.variant.title}
              </span>
              <span className="text-sm text-neutral-500">{formatPrice(booking.totalPrice)}</span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{ width: `${((currentStepIndex) / (steps.length - 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              {steps.map((s, i) => (
                <span key={s} className={cn('flex-1 text-center', i <= currentStepIndex && 'font-semibold text-brand')}>
                  {stepLabels[i]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 pb-24 max-w-2xl">
        {submitError && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {submitError}
          </div>
        )}

        <article className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm ring-1 ring-neutral-200 dark:ring-white/10 p-4 sm:p-6">
          {/* Step Indicator */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold text-neutral-900 dark:text-white">
                {stepLabels[currentStepIndex]}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {step === 'review' && 'Review the waiver terms and accept to continue'}
                {step === 'health' && 'Complete the medical declaration'}
                {step === 'emergency' && 'Provide emergency contact information'}
                {step === 'id' && 'Verify your identity with a photo ID'}
                {step === 'sign' && 'Sign the waiver with your signature'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
            </div>
          </div>

          {/* Step Content */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Step 1: Review Waiver */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="rounded-xl bg-brand/5 p-4 border border-brand/20">
                  <p className="text-sm text-brand-ink">
                    <strong>Waiver Version:</strong> {WAIVER_VERSION} &nbsp;|&nbsp;
                    <strong>Booking:</strong> {booking?.bookingCode} &nbsp;|&nbsp;
                    <strong>Date:</strong> {formatDisplayDate(booking.bookingDate)}
                  </p>
                </div>

                <div className="prose prose-neutral dark:prose-invert max-w-none max-h-96 overflow-y-auto pr-4">
                  {WAIVER_SECTIONS.map((section) => (
                    <section key={section.title} className="mb-6">
                      <h3 className="font-heading text-lg font-bold text-neutral-900 dark:text-white mb-3">
                        {section.title}
                      </h3>
                      <div className="space-y-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {section.body.map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-semibold mb-1">By continuing, you acknowledge:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You have read and understood all sections above</li>
                        <li>You accept the risks and release of liability</li>
                        <li>You will complete the health declaration, emergency contact, ID verification, and signature</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 min-h-[52px] bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors"
                  >
                    I Understand & Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Health Declaration */}
            {step === 'health' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Medical Declaration</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Please confirm each statement honestly. This information is confidential and used only for your safety.
                </p>

                <div className="space-y-4">
                  <label className="flex items-start gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverData.healthDeclaration.noAlcohol}
                      onChange={(e) => toggleHealth('noAlcohol', e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-brand focus:ring-brand"
                    />
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-medium">No Alcohol</p>
                      <p className="text-xs text-neutral-500">I will not consume alcohol before or during the activity.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverData.healthDeclaration.noDrugs}
                      onChange={(e) => toggleHealth('noDrugs', e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-brand focus:ring-brand"
                    />
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-medium">No Drugs</p>
                      <p className="text-xs text-neutral-500">I will not be under the influence of illegal or recreational drugs.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverData.healthDeclaration.noImpairingMeds}
                      onChange={(e) => toggleHealth('noImpairingMeds', e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-brand focus:ring-brand"
                    />
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-medium">No Impairing Medication</p>
                      <p className="text-xs text-neutral-500">I am not taking medication that impairs my judgment or coordination.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waiverData.healthDeclaration.mobilityOk}
                      onChange={(e) => toggleHealth('mobilityOk', e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-brand focus:ring-brand"
                    />
                    <div className="text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-medium">Mobility OK</p>
                      <p className="text-xs text-neutral-500">I have the physical mobility required for this activity.</p>
                    </div>
                  </label>

                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-white/10">
                    <p className="font-medium text-neutral-900 dark:text-white mb-3">Disclosed Conditions (optional)</p>
                    <p className="text-xs text-neutral-500 mb-3">Select any conditions you wish to disclose. The guide may adjust the activity for your safety.</p>
                    <div className="flex flex-wrap gap-2">
                      {['Pregnancy', 'Heart Condition', 'Epilepsy', 'Recent Surgery', 'Back/Neck Problems', 'Asthma', 'Diabetes', 'High Blood Pressure', 'Other'].map((condition) => (
                        <label key={condition} className="flex items-center gap-2 rounded-full border border-neutral-300 dark:border-white/10 px-3 py-1.5 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={waiverData.healthDeclaration.disclosedConditions.includes(condition)}
                            onChange={() => toggleCondition(condition)}
                            className="h-4 w-4 rounded border-neutral-300 text-brand focus:ring-brand"
                          />
                          {condition}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={nextStep} disabled={!isStepValid()} className="min-h-[52px] px-8 bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact */}
            {step === 'emergency' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Emergency Contact</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Provide a contact we can reach in case of emergency during the activity.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={waiverData.emergencyContact.name}
                      onChange={(e) => updateEmergency('name', e.target.value)}
                      className="w-full min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Phone Number (with country code)</label>
                    <input
                      type="tel"
                      value={waiverData.emergencyContact.phone}
                      onChange={(e) => updateEmergency('phone', e.target.value)}
                      className="w-full min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      placeholder="+62 812 3456 7890"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={waiverData.emergencyContact.relation}
                      onChange={(e) => updateEmergency('relation', e.target.value)}
                      className="w-full min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      placeholder="Spouse / Parent / Friend"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="flex-1 min-h-[52px] rounded-xl border border-neutral-300 text-neutral-900 font-semibold hover:bg-neutral-50">
                    Back
                  </button>
                  <button type="button" onClick={nextStep} disabled={!isStepValid()} className="min-h-[52px] px-8 bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: ID Verification */}
            {step === 'id' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Identity Verification</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Upload a clear photo of your government-issued ID (KTP, Passport, or Driver&apos;s License).
                  This is required for safety and liability purposes.
                </p>

                <div className="space-y-4">
                  {photoPreview ? (
                    <>
                      <div className="relative rounded-xl border-2 border-brand p-4 bg-white dark:bg-neutral-800">
                        <div className="relative aspect-video rounded-lg overflow-hidden">
                          <Image
                            src={photoPreview}
                            alt="ID preview"
                            fill
                            className="object-cover"
                            sizes="100vw"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-600"
                          aria-label="Remove photo"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-3 text-center text-sm text-green-700 dark:text-green-400 font-medium">
                        ID uploaded successfully ✓
                      </p>
                    </>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-neutral-300 dark:border-white/10 p-8 text-center">
                      <Camera className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                      <p className="text-neutral-600 dark:text-neutral-400 mb-4">Upload a clear photo of your ID</p>
                      <label className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-brand-ink px-6 text-base font-semibold text-white hover:bg-neutral-900 cursor-pointer">
                        <Camera className="h-5 w-5" />
                        Choose File
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          capture="environment"
                        />
                      </label>
                      <p className="mt-3 text-xs text-neutral-500">JPG/PNG, max 5MB. Capture environment preferred.</p>
                    </div>
                  )}

                  {submitError && step === 'id' && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="flex-1 min-h-[52px] rounded-xl border border-neutral-300 text-neutral-900 font-semibold hover:bg-neutral-50">
                    Back
                  </button>
                  <button type="button" onClick={nextStep} disabled={!isStepValid()} className="min-h-[52px] px-8 bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Signature */}
            {step === 'sign' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Sign the Waiver</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Sign by drawing or typing your full name. By signing, you confirm all information is accurate and you accept the waiver terms.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWaiverData(prev => ({ ...prev, signatureMethod: 'draw' }))}
                      className={cn(
                        'flex-1 min-h-[44px] rounded-xl border font-semibold transition-colors',
                        waiverData.signatureMethod === 'draw'
                          ? 'bg-brand-ink text-white border-brand-ink'
                          : 'border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                      )}
                    >
                      <PenTool className="mx-auto h-5 w-5" />
                      <span className="sr-only">Draw signature</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaiverData(prev => ({ ...prev, signatureMethod: 'type' }))}
                      className={cn(
                        'flex-1 min-h-[44px] rounded-xl border font-semibold transition-colors',
                        waiverData.signatureMethod === 'type'
                          ? 'bg-brand-ink text-white border-brand-ink'
                          : 'border-neutral-300 text-neutral-900 hover:bg-neutral-50'
                      )}
                    >
                      <FileText className="mx-auto h-5 w-5" />
                      <span className="sr-only">Type signature</span>
                    </button>
                  </div>

                  {waiverData.signatureMethod === 'draw' ? (
                    <div className="rounded-xl border-2 border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-800">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-48 touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{ touchAction: 'none' }}
                      />
                      <div className="flex gap-2 p-3 border-t border-neutral-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="flex-1 min-h-[44px] rounded-lg border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-50"
                        >
                          Clear
                        </button>
                        <span className="flex-1 text-center text-sm text-neutral-500">
                          Draw your signature above
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-neutral-300 dark:border-white/10 p-4 bg-white dark:bg-neutral-800">
                      <input
                        type="text"
                        value={waiverData.digitalSignature}
                        onChange={(e) => handleTypedSignature(e.target.value)}
                        className="w-full min-h-[48px] rounded-xl border-none bg-transparent text-2xl font-semibold text-center text-neutral-900 dark:text-white outline-none placeholder:text-neutral-400"
                        placeholder="Type your full legal name"
                      />
                      <p className="mt-2 text-center text-xs text-neutral-500">
                        Typing your full legal name constitutes your electronic signature.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-neutral-200 dark:border-white/10">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Full Legal Name (for typed signature)
                    </label>
                    <input
                      type="text"
                      value={waiverData.signedBy}
                      onChange={(e) => setWaiverData(prev => ({ ...prev, signedBy: e.target.value }))}
                      className="w-full min-h-[48px] rounded-xl border border-neutral-300 px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      placeholder="Full legal name"
                      required
                    />
                  </div>

                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-4 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold mb-1">By signing, you confirm:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>All information provided is accurate and complete</li>
                          <li>You have read and understood the waiver terms</li>
                          <li>You accept the risks and release of liability</li>
                          <li>You will follow all safety rules and guide instructions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={prevStep} className="flex-1 min-h-[52px] rounded-xl border border-neutral-300 text-neutral-900 font-semibold hover:bg-neutral-50">
                    Back
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={submitting || !isStepValid()} className="min-h-[52px] px-8 bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {submitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</span>
                    ) : (
                      'Sign & Complete'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </article>

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step !== 'review' && (
            <button type="button" onClick={prevStep} className="flex-1 min-h-[52px] rounded-xl border border-neutral-300 text-neutral-900 font-semibold hover:bg-neutral-50">
              <ChevronDown className="inline h-5 w-5 mr-2" /> Back
            </button>
          )}
          {!['review', 'health', 'emergency', 'id', 'sign'].includes(step as any) && (
            <button
              type="button"
              onClick={nextStep}
              disabled={submitting || !isStepValid()}
              className="min-h-[52px] px-8 bg-brand-ink text-white font-semibold rounded-xl hover:bg-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Submitting...</span>
              ) : step === 'sign' ? (
                'Sign & Complete'
              ) : (
                <span className="flex items-center gap-2">Continue <ChevronUp className="h-5 w-5" /></span>
              )}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default WaiverSigningPage;