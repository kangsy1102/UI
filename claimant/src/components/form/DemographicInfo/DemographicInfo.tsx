import { Fieldset } from "@trussworks/react-uswds";
import { Normalize, useTranslation } from "react-i18next";

import claimForm from "../../../i18n/en/claimForm";
import { TextField } from "../fields/TextField/TextField";
import { RadioField } from "../fields/RadioField/RadioField";
import DropdownField from "../fields/DropdownField/DropdownField";
import { CheckboxGroupField } from "../fields/CheckboxGroupField/CheckboxGroupField";
import { ClaimSchemaFields } from "../../../common/YupBuilder";

import formStyles from "../form.module.scss";

export const DEMOGRAPHIC_INFORMATION_SCHEMA_FIELDS: ClaimSchemaFields[] = [
  "birthdate",
  "sex",
  "race",
  "ethnicity",
  "education_level",
];

type SexOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.sex.options>;
};

const sexOptions: SexOption[] = Object.keys(claimForm.sex.options).map(
  (option) => ({
    value: option,
    translationKey: option as Normalize<typeof claimForm.sex.options>,
  })
);

type RaceOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.race.options>;
};

const raceOptions: RaceOption[] = Object.keys(claimForm.race.options).map(
  (option) => ({
    value: option,
    translationKey: option as Normalize<typeof claimForm.race.options>,
  })
);

type EthnicityOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.ethnicity.options>;
};

const ethnicityOptions: EthnicityOption[] = Object.keys(
  claimForm.ethnicity.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<typeof claimForm.ethnicity.options>,
}));

type EducationLevelOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.education_level.options>;
};

const educationLevelOptions: EducationLevelOption[] = Object.keys(
  claimForm.education_level.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<typeof claimForm.education_level.options>,
}));

export const DemographicInfo = () => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <TextField
        className={formStyles.field}
        name="birthdate"
        label={t("birthdate.label")}
        id="birthdate"
        type="text"
        readOnly
        disabled
      />
      <Fieldset legend={t("sex.label")} className={formStyles.field}>
        <RadioField
          id="sex"
          name="sex"
          options={sexOptions.map((option) => {
            return {
              label: t(`sex.options.${option.translationKey}`),
              value: option.value,
            };
          })}
        />
      </Fieldset>
      <Fieldset legend={t("ethnicity.label")} className={formStyles.field}>
        <RadioField
          id="ethnicity"
          name="ethnicity"
          options={ethnicityOptions.map((option) => {
            return {
              label: t(`ethnicity.options.${option.translationKey}`),
              value: option.value,
            };
          })}
        />
      </Fieldset>
      <Fieldset legend={t("race.label")} className={formStyles.field}>
        <CheckboxGroupField
          id="race"
          name="race"
          options={raceOptions.map((raceOption) => ({
            label: t(`race.options.${raceOption.translationKey}`),
            value: raceOption.value,
          }))}
        />
      </Fieldset>
      <DropdownField
        id="education_level"
        name="education_level"
        label={t("education_level.label")}
        startEmpty
        options={educationLevelOptions.map((option) => ({
          value: option.value,
          label: t(`education_level.options.${option.translationKey}`),
        }))}
      />
    </>
  );
};