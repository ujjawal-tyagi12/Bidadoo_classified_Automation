/**
 * Deliberately fixed, curated values for the Custom Attributes module's
 * edge-case and negative-input scenarios — same reasoning as
 * `data/props/listings.props.ts`.
 */
export type CustomAttributesProps = {
  /** Over the confirmed-live 25-character limit for Attribute Name. */
  longAttributeName: string;
  /**
   * Confirmed live to be 15 characters or fewer — a value over 15 characters
   * silently disables Create with no error shown (a real app bug matching
   * BIDC-475 #14, see requirements doc §2). Mixed case + a space, to exercise
   * varied content that's genuinely accepted.
   */
  variedContentValue: string;
  /** A classic SQL-injection probe string — confirms the Name input treats it as inert text. */
  sqlInjectionString: string;
  /** A classic XSS probe string — confirms the Value input treats it as inert text, not executable markup. */
  xssString: string;
};
