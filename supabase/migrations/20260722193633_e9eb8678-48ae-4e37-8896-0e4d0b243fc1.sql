
CREATE OR REPLACE FUNCTION public.next_invoice_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year text;
  last_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM 'SE-INV-' || current_year || '-(\d+)') AS integer)
  ), 0) INTO last_num FROM public.invoices WHERE invoice_number LIKE 'SE-INV-' || current_year || '-%';
  RETURN 'SE-INV-' || current_year || '-' || LPAD((last_num + 1)::text, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_receipt_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year text;
  last_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'SE-RCPT-' || current_year || '-(\d+)') AS integer)
  ), 0) INTO last_num FROM public.receipts WHERE receipt_number LIKE 'SE-RCPT-' || current_year || '-%';
  RETURN 'SE-RCPT-' || current_year || '-' || LPAD((last_num + 1)::text, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_quotation_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_year text;
  last_num integer;
BEGIN
  current_year := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(quotation_number FROM 'SE-QUO-' || current_year || '-(\d+)') AS integer)
  ), 0) INTO last_num FROM public.quotations WHERE quotation_number LIKE 'SE-QUO-' || current_year || '-%';
  RETURN 'SE-QUO-' || current_year || '-' || LPAD((last_num + 1)::text, 4, '0');
END;
$function$;
