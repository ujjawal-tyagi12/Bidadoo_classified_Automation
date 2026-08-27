/**
 * Deliberately fixed, curated values for the Listings module's edge-case and
 * negative-input scenarios — each one exists to exercise one specific,
 * confirmed-live behavior in a way that stays readable in a report. See
 * `data/props/login.props.ts` for the same reasoning applied to Login.
 */
export type ListingsProps = {
  /** Contains punctuation/symbols a naive renderer might mishandle. */
  specialCharsEquipmentName: string;
  /** Well over any reasonable column width, to check the table doesn't break. */
  longEquipmentName: string;
  /** A classic SQL-injection probe string — confirms the search input treats it as inert text. */
  sqlInjectionSearchString: string;
  /** A classic XSS probe string — confirms the search input treats it as inert text, not executable markup. */
  xssSearchString: string;
  /** Guaranteed not to match any real equipment name, for the "no results" empty-state scenario. */
  nonExistentSearchQuery: string;
  /** Replaces a listing's generated title in the edit-and-save scenario (BIDC-298 §11). */
  updatedEquipmentTitle: string;
  /** Replaces a listing's generated price in the edit-and-save scenario (BIDC-298 §11). */
  updatedEquipmentPrice: string;
};
