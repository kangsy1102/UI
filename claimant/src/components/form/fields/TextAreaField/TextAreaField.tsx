import React, { ReactNode } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  Textarea,
  ErrorMessage,
} from "@trussworks/react-uswds";

type TextareaProps = React.ComponentProps<typeof Textarea>;

interface ITextAreaFieldProps extends TextareaProps {
  label: ReactNode;
  labelClassName?: string;
  labelHint?: string;
  hint?: ReactNode;
}

export const TextAreaField = ({
  label,
  labelClassName,
  labelHint,
  hint,
  ...textareaProps
}: ITextAreaFieldProps) => {
  const [fieldProps, metaProps] = useField({
    name: textareaProps.name,
  });
  const showError = metaProps.touched && !!metaProps.error;

  return (
    <FormGroup error={showError}>
      <Label
        error={showError}
        className={labelClassName}
        hint={labelHint}
        htmlFor={textareaProps.id || textareaProps.name}
      >
        {label}
      </Label>

      <div className="usa-hint" id={`${textareaProps.name}-hint`}>
        {hint}
      </div>

      <Textarea {...fieldProps} {...textareaProps} />

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default TextAreaField;