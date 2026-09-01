'use client';

import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui';

interface BookingFormProps {
  onSuccess?: (bookingId: string) => void;
}

interface FormData {
  name: string;
  email: string;
  whatsapp: string;
  bookingDate: string;
  participants: number;
  specialRequests: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  whatsapp?: string;
  bookingDate?: string;
}

export function BookingForm({ onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    whatsapp: '',
    bookingDate: '',
    participants: 1,
    specialRequests: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addBooking = useBookingStore((state) => state.addBooking);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp is required';
    if (!formData.bookingDate) newErrors.bookingDate = 'Booking date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const bookingId = `bk_${Date.now()}`;
      addBooking({
        ventureId: bookingId,
        title: 'Booking',
        participants: formData.participants,
        totalPrice: 0,
        bookingDate: formData.bookingDate,
      });
      onSuccess?.(bookingId);
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
      </div>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
      </div>
      <div>
        <input
          type="text"
          placeholder="WhatsApp"
          value={formData.whatsapp}
          onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
        />
        {errors.whatsapp && <span className="text-red-500 text-sm">{errors.whatsapp}</span>}
      </div>
      <div>
        <input
          type="date"
          value={formData.bookingDate}
          onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
        />
        {errors.bookingDate && <span className="text-red-500 text-sm">{errors.bookingDate}</span>}
      </div>
      <div>
        <input
          type="number"
          min="1"
          value={formData.participants}
          onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || 1 })}
        />
      </div>
      <div>
        <textarea
          placeholder="Special requests"
          value={formData.specialRequests}
          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Book Now'}
      </Button>
    </form>
  );
}

export default BookingForm;

