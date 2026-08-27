export type AssetInformationProps = {
  referenceId?: string;
  title: string;
  make: string;
  model: string;
  /** Category tree path from top-level to leaf, e.g. ["Construction Equipment", "Aerial Work Platforms", "Boom Lifts - Articulating"]. */
  categoryPath: string[];
  year: string;
  serial?: string;
  usageHours?: string;
  usageType?: "Hours" | "Miles" | "Kilometers";
};

export type LocationProps = {
  country: string;
  state: string;
  city?: string;
};

export type PricingContactProps = {
  price: string;
  /** "" matches the real "Select Currency" placeholder option's empty value — used to test the required-field case. */
  currency: "" | "USD" | "CAD";
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export type DescriptionDetailsProps = {
  description: string;
  features?: string;
  specifications?: string;
};

export type MediaUploadProps = {
  validVideoLink: string;
  unsupportedDomainVideoLink: string;
  /** Base URL used to generate 5 distinct links for the max-video-links test — a numeric suffix is appended per link. */
  videoLinkBaseUrl: string;
  /** Not a URL at all (as opposed to unsupportedDomainVideoLink, which is well-formed but the wrong domain). */
  malformedVideoLink: string;
};

export type CreateEquipmentProps = {
  validAssetInformation: AssetInformationProps;
  validLocation: LocationProps;
  validPricingContact: PricingContactProps;
  validDescriptionDetails: DescriptionDetailsProps;
  mediaUpload: MediaUploadProps;
};

/**
 * What actually still lives in the static `create-equipment.json` fixture:
 * the Category tree path (not sourceable from a live API yet — see
 * `data/factories/create-equipment.factory.ts`) and the video-link values
 * (no config API found for the allowed-domain whitelist). Everything else
 * `CreateEquipmentProps` has is generated live by the factory instead.
 */
export type CreateEquipmentStaticData = {
  categoryPath: string[];
  mediaUpload: MediaUploadProps;
};
