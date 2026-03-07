import { Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Extend navigator for Contact Picker API
declare global {
  interface ContactAddress {
    city?: string;
    country?: string;
    dependentLocality?: string;
    organization?: string;
    phone?: string;
    postalCode?: string;
    recipient?: string;
    region?: string;
    sortingCode?: string;
    addressLine?: string[];
  }
  interface ContactInfo {
    name?: string[];
    email?: string[];
    tel?: string[];
    address?: ContactAddress[];
    icon?: Blob[];
  }
  interface ContactsManager {
    select(properties: string[], options?: { multiple?: boolean }): Promise<ContactInfo[]>;
    getProperties(): Promise<string[]>;
  }
  interface Navigator {
    contacts?: ContactsManager;
  }
}

export interface PickedContact {
  name?: string;
  phone?: string;
  email?: string;
}

interface ContactPickerProps {
  onPick: (contact: PickedContact) => void;
  multiple?: boolean;
  onPickMultiple?: (contacts: PickedContact[]) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
  label?: string;
}

const ContactPicker = ({ onPick, multiple = false, onPickMultiple, variant = 'outline', size = 'sm', className, label }: ContactPickerProps) => {
  const isSupported = typeof navigator !== 'undefined' && 'contacts' in navigator;

  const handlePick = async () => {
    if (!isSupported || !navigator.contacts) {
      toast.error('Kifaa chako hakisapoti Contact Picker. Tumia Android Chrome.');
      return;
    }

    try {
      const properties = await navigator.contacts.getProperties();
      const requestProps = ['name', 'tel'];
      if (properties.includes('email')) requestProps.push('email');

      const contacts = await navigator.contacts.select(requestProps, { multiple });

      if (!contacts || contacts.length === 0) return;

      const mapped: PickedContact[] = contacts.map(c => ({
        name: c.name?.[0] || undefined,
        phone: c.tel?.[0] || undefined,
        email: c.email?.[0] || undefined,
      }));

      if (multiple && onPickMultiple) {
        onPickMultiple(mapped);
      } else if (mapped[0]) {
        onPick(mapped[0]);
      }
    } catch (err: any) {
      if (err.name !== 'InvalidStateError' && err.message !== 'Request cancelled') {
        toast.error('Imeshindikana kusoma contacts');
      }
    }
  };

  if (!isSupported) return null;

  return (
    <Button type="button" variant={variant} size={size} onClick={handlePick} className={className} title="Chagua kutoka Contacts">
      <Contact className="w-4 h-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
};

export default ContactPicker;
