export type FilterCase = {
  input: string;
  expected: string;
};

export type EmailValidationCase = {
  email: string;
  expectError: boolean;
};

export type MinLengthContactProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/**
 * All values below are the real, live-confirmed input/output pairs from
 * docs/requirements/contact-seller-automation-requirements.md §2/§3 — the
 * Contact Seller form's First Name/Last Name/Phone fields silently strip
 * disallowed characters as the user types, they are not passively accepted
 * or rejected with a post-submit validation error.
 */
export type ContactSellerValidationProps = {
  firstNameFilterCases: FilterCase[];
  lastNameFilterCases: FilterCase[];
  phoneFilterCases: FilterCase[];
  emailWithSurroundingSpaces: FilterCase;
  emailValidationCases: EmailValidationCase[];
  minLengthContact: MinLengthContactProps;
  modifiedMessage: string;
};
