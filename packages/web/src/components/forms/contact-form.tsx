'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Building2, Mail, Phone, MapPin, Briefcase, Tag } from 'lucide-react';

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  jobTitle: string;
  companyId: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  notes: string;
  tags: string[];
}

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactFormData) => Promise<void>;
  initialData?: Partial<ContactFormData>;
  companies?: Array<{ id: string; name: string }>;
}

export function ContactForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  companies = []
}: ContactFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    mobile: initialData?.mobile || '',
    jobTitle: initialData?.jobTitle || '',
    companyId: initialData?.companyId || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    province: initialData?.province || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'Italia',
    notes: initialData?.notes || '',
    tags: initialData?.tags || []
  });

  const handleChange = (field: keyof ContactFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome richiesto';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Cognome richiesto';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Modifica Contatto' : 'Nuovo Contatto'}
      description="Inserisci i dati del contatto"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Salvataggio...' : initialData ? 'Aggiorna' : 'Crea Contatto'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Informazioni Base
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={formData.firstName}
                onChange={e => handleChange('firstName', e.target.value)}
                placeholder="Mario"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Cognome *</label>
              <Input
                value={formData.lastName}
                onChange={e => handleChange('lastName', e.target.value)}
                placeholder="Rossi"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Contatti
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="mario.rossi@email.it"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Telefono</label>
              <Input
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+39 02 1234567"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cellulare</label>
              <Input
                value={formData.mobile}
                onChange={e => handleChange('mobile', e.target.value)}
                placeholder="+39 333 1234567"
              />
            </div>
          </div>
        </div>

        {/* Work Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Lavoro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Azienda</label>
              <select
                value={formData.companyId}
                onChange={e => handleChange('companyId', e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Seleziona azienda...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Ruolo</label>
              <Input
                value={formData.jobTitle}
                onChange={e => handleChange('jobTitle', e.target.value)}
                placeholder="Responsabile Acquisti"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Indirizzo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Indirizzo</label>
              <Input
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Via Roma 123"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Città</label>
              <Input
                value={formData.city}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="Milano"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Provincia</label>
              <Input
                value={formData.province}
                onChange={e => handleChange('province', e.target.value)}
                placeholder="MI"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CAP</label>
              <Input
                value={formData.postalCode}
                onChange={e => handleChange('postalCode', e.target.value)}
                placeholder="20100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Paese</label>
              <Input
                value={formData.country}
                onChange={e => handleChange('country', e.target.value)}
                placeholder="Italia"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Note</label>
          <textarea
            value={formData.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Note aggiuntive..."
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
          />
        </div>
      </div>
    </Modal>
  );
}

export default ContactForm;
