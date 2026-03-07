import { Input } from '@/components/ui/input';
import ContactPicker, { type PickedContact } from '@/components/ContactPicker';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onContactPicked?: (contact: PickedContact) => void;
  placeholder?: string;
  className?: string;
}

const PhoneInput = ({ value, onChange, onContactPicked, placeholder = '7XXXXXXXX', className }: PhoneInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^\d+]/g, '');
    if (!val.startsWith('+255')) {
      val = '+255' + val.replace(/^\+?255?/, '');
    }
    onChange(val);
  };

  const displayValue = value || '+255';

  const handlePick = (contact: PickedContact) => {
    if (contact.phone) {
      let phone = contact.phone.replace(/[\s\-()]/g, '');
      if (!phone.startsWith('+255')) {
        phone = '+255' + phone.replace(/^(\+?255|0)/, '');
      }
      onChange(phone);
    }
    if (onContactPicked) onContactPicked(contact);
  };

  return (
    <div className="flex gap-1">
      <Input
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={"+255" + placeholder}
        className={className}
        maxLength={16}
      />
      <ContactPicker onPick={handlePick} size="icon" variant="outline" />
    </div>
  );
};

export default PhoneInput;
