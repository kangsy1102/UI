import { Fieldset } from "@trussworks/react-uswds";
import { TFunction, useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { TextField } from "../../../components/form/fields/TextField/TextField";
import { IPageDefinition } from "../../PageDefinitions";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { CheckboxField } from "../../../components/form/fields/CheckboxField/CheckboxField";
import { PhoneNumberField } from "../../../components/form/PhoneNumberField/PhoneNumberField";
import { yupPhone } from "../../../common/YupBuilder";
import * as yup from "yup";
import { useClearFields } from "../../../hooks/useClearFields";

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    // email is not editable, so omit required() but include the schema def just in case.
    email: yup.string().email(),
    phones: yup.array().of(yupPhone(t)).required(),
    interpreter_required: yup
      .boolean()
      .required(t("contact_information.interpreter_required.required")),
    preferred_language: yup.string().when("interpreter_required", {
      is: true,
      then: yup
        .string()
        .required(t("contact_information.preferred_language.required")),
    }),
  });

export const ContactInformation = () => {
  const { t } = useTranslation("claimForm", {
    keyPrefix: "contact_information",
  });
  const { values } = useFormikContext<ClaimantInput>();

  // Remove phones[1] if unchecked TODO: Use Formik FieldArray to represent field array?
  useClearFields(
    !values.LOCAL_more_phones && values.phones && values.phones.length > 1,
    {
      fieldName: "phones",
      value: [values.phones?.[0]],
    }
  );

  return (
    <>
      <Fieldset legend={t("what_is_your_contact_information")}>
        <PhoneNumberField id="phones[0]" name="phones[0]" showSMS={false} />
        <CheckboxField
          id="LOCAL_more_phones"
          name="LOCAL_more_phones"
          data-testid="LOCAL_more_phones"
          label={t("more_phones")}
        />
        {values.LOCAL_more_phones && (
          <PhoneNumberField id="phones[1]" name="phones[1]" showSMS={false} />
        )}
      </Fieldset>
      <TextField
        name="email"
        id="email"
        type="text"
        label={t("email")}
        disabled
        readOnly
      />
      <Fieldset legend={t("interpreter_required.label")}>
        <BooleanRadio id="interpreter_required" name="interpreter_required" />
      </Fieldset>
      <TextField
        label={t("preferred_language.label")}
        id={"preferred_language"}
        name={"preferred_language"}
        type="text"
      />
    </>
  );
};

export const ContactInformationPage: IPageDefinition = {
  path: "contact-information",
  heading: "contact_information",
  initialValues: {
    email: undefined, // whoami will populate
    phones: [{ number: "" }],
    LOCAL_more_phones: undefined,
    interpreter_required: undefined,
    preferred_language: "",
  },
  Component: ContactInformation,
  pageSchema,
};
