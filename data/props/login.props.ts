/**
 * Deliberately fixed, curated negative-test values for the Login screen —
 * each one exists to violate one specific, confirmed-live rule in a way
 * that's still readable in a report (e.g. "not-an-email" reads clearly as
 * "no @ sign", vs. a random Faker string that would obscure which rule is
 * being tested). Genuinely arbitrary values (any well-formed email, any
 * valid-length password) are Faker-generated directly in the steps instead —
 * see `tests/ui/step-definitions/login.steps.ts`.
 */
export type LoginProps = {
  /** Fails the app's email regex (no @) — confirmed live, button stays disabled. */
  invalidEmailFormat: string;
  /** One character under the confirmed 8-character minimum. */
  underMinimumPassword: string;
};
