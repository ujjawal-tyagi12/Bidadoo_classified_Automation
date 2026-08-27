export type ContactSellerFormProps = {
  firstName: string;
  lastName?: string;
  email: string;
  phone: string;
  message?: string;
};

export type EquipmentDetailProps = {
  validContactSeller: ContactSellerFormProps;
  invalidEmail: string;
};
