import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const PhoneInput = ({ value, onChange, placeholder = '7XXXXXXXX', className }: PhoneInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    val = val.replace(/[^\d+]/g, '');
    if (!val.startsWith('+255')) {
      val = '+255' + val.replace(/^\+?255?/, '');
    }
    onChange(val);
  };

  const displayValue = value || '+255';

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      placeholder={"+255" + placeholder}
      className={className}
      maxLength={16}
    />
  );
};

export default PhoneInput;
