import { useTranslation } from "react-i18next";
import {
  ErrorMessage,
  Fieldset,
  FormGroup,
  Button,
} from "@trussworks/react-uswds";
import { Employer as EmployerProfile } from "../../components/form/Employer/Employer";
import { YesNoRadio } from "../../components/form/YesNoRadio/YesNoRadio";
import { ClaimSchemaFields } from "../../common/YupBuilder";
import { useFormikContext } from "formik";
import * as yup from "yup";
import i18next from "i18next";

export const EmployerFields: ClaimSchemaFields[] = ["employers"];

export const EMPLOYER_ADDITIONAL_VALIDATIONS = {
  LOCAL_more_employers: yup
    .array()
    .of(yup.string())
    .test(
      "len-matches-employers",
      i18next.t("validation.required"),
      (value, ctx) => {
        if (value?.length !== ctx.parent.employers.length) {
          ctx.createError({
            message: i18next.t("validation.required"),
          });
          return false;
        }
        return true;
      }
    ),
};

interface IEmployerFields {
  employers: EmployerType[];
  LOCAL_more_employers: string[];
}

export const EmployerRepeatable = (
  currentSegment: string | undefined,
  values: FormValues
) => {
  if (!values["LOCAL_more_employers"]) {
    return false;
  }
  const currentSegmentIdx = parseInt(currentSegment || "0");
  return currentSegment === undefined
    ? values.LOCAL_more_employers[0] === "yes"
    : values.LOCAL_more_employers[currentSegmentIdx] === "yes";
};

export const EmployerNextSegment = (currentSegment: string | undefined) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  return currentSegment === undefined ? "1" : currentSegmentIdx + 1 + "";
};

export const EmployerPreviousSegment = (currentSegment: string | undefined) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  if (currentSegmentIdx - 1 < 0) {
    return false;
  } else {
    return currentSegmentIdx - 1 + "";
  }
};

export const Employer = (props: PageProps) => {
  const { t } = useTranslation("claimForm");
  const { values, touched, errors, setValues } =
    useFormikContext<IEmployerFields>();
  const segment = props.segment || "0";
  const showMoreEmployersError =
    touched.LOCAL_more_employers && !!errors.LOCAL_more_employers;

  const removeEmployer = (idx: number) => {
    const employers = values.employers.filter((_, i) => i !== idx);
    const LOCAL_more_employers = values.LOCAL_more_employers.filter(
      (_, i) => i !== idx
    );
    setValues((form) => ({
      ...form,
      employers,
      LOCAL_more_employers,
    }));
  };

  return (
    <>
      {values.employers?.map((employer, idx) => (
        <div key={idx}>
          <span>{employer.name}</span>
          &nbsp;
          <Button
            type="button"
            className="usa-button--outline"
            onClick={() => removeEmployer(idx)}
          >
            X [{idx}]
          </Button>
        </div>
      ))}
      <EmployerProfile segment={segment} />
      <Fieldset legend={t("employers.more_employers.label")}>
        <FormGroup error={showMoreEmployersError}>
          <YesNoRadio
            id={`LOCAL_more_employers[${segment}]`}
            name={`LOCAL_more_employers[${segment}]`}
          />
        </FormGroup>
        {showMoreEmployersError && (
          <ErrorMessage>{errors.LOCAL_more_employers}</ErrorMessage>
        )}
      </Fieldset>
    </>
  );
};