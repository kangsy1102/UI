import { TextField } from "../TextField/TextField";
import {
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useField } from "formik";
import { currencyRegex } from "../../../../utils/format";

type TextFieldProps = Omit<ComponentProps<typeof TextField>, "type">;

interface CurrencyFieldProps extends TextFieldProps {
  id: string;
  name: string;
  label: string;
  inputPrefix?: ReactNode;
}

const CurrencyField = ({
  id,
  name,
  label,
  inputPrefix = "$",
  ...inputProps
}: CurrencyFieldProps) => {
  const [fieldProps, metaProps, fieldHelperProps] = useField<
    string | undefined
  >(name);
  const dollarStringToCentsString = (dollars: string) =>
    (Number(dollars) * 100).toFixed();
  const centsStringToDollarsString = (cents: string) =>
    (Number(cents) / 100).toFixed(2);

  const isMounted = useRef(false);
  const [dollarValue, setDollarValue] = useState<string>(() =>
    metaProps.initialValue
      ? centsStringToDollarsString(metaProps.initialValue)
      : ""
  );

  useEffect(() => {
    // prevent unnecessary calculation on initial mount
    if (isMounted.current) {
      const getFormikValue = () => {
        if (!dollarValue) {
          return "";
        }
        if (dollarValue.match(currencyRegex)) {
          return dollarStringToCentsString(dollarValue);
        }
        // don't set to fixed value so that validation can apply
        return String(Number(dollarValue) * 100);
      };
      fieldHelperProps.setValue(getFormikValue());
    } else {
      isMounted.current = true;
    }
  }, [dollarValue]);

  const handleFieldChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setDollarValue(e.target.value);
    if (inputProps?.onChange) {
      inputProps.onChange(e);
    }
  };

  return (
    <TextField
      {...fieldProps}
      id={id}
      label={label}
      name={name}
      type="text"
      value={dollarValue}
      inputPrefix={inputPrefix}
      {...inputProps}
      onChange={handleFieldChange}
    />
  );
};

export default CurrencyField;