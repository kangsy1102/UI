type WhoAmI = {
  claim_id?: string;
  claimant_id: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  ssn: string;
  email: string;
  phone: string;
  swa_code: string;
};

type ClaimResponse = {
  status: string;
  claim_id: string;
};

type PersonName = {
  first_name: string;
  middle_name?: string;
  last_name: string;
};

type YesNo = "yes" | "no";

type ClaimantNamesType = {
  claimant_name?: PersonName;
  claimant_has_alternate_names?: YesNo;
  alternate_names?: PersonName[];
};

type ClaimantInput = ClaimantNamesType & {
  birthdate?: string;
  ssn?: string;
  email?: string;
  phone?: string | null;
  is_complete?: boolean;
};

type Claim = ClaimantInput & {
  id?: string;
  swa_code: string;
  claimant_id: string;
};

type FormValues = {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: string | boolean | any;
};
