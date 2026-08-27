import { loadJson, resolveDataPath } from "../../core/utils/file.util.js";

const DEFAULT_TESTDATA_DIR = "data/testdata";
const TESTDATA_ENV = "TESTDATA_PATH";

function loadTestDataProps<T>(filename: string): T {
  const path = resolveDataPath(DEFAULT_TESTDATA_DIR, filename, TESTDATA_ENV);
  return loadJson<T>(path);
}

import type { CreateEquipmentProps } from "../props/create-equipment.props.js";
import type { EquipmentDetailProps } from "../props/equipment-detail.props.js";
import type { EquipmentFavoriteProps } from "../props/equipment-favorite.props.js";
import type { ContactSellerValidationProps } from "../props/contact-seller.props.js";

// Add loader functions here as you add {module}.props.ts + {module}.json files, e.g.:
//
// export function loadLoginProps(): LoginProps {
//   return loadTestDataProps<LoginProps>("login.json");
// }

export function loadCreateEquipmentProps(): CreateEquipmentProps {
  return loadTestDataProps<CreateEquipmentProps>("create-equipment.json");
}

export function loadEquipmentDetailProps(): EquipmentDetailProps {
  return loadTestDataProps<EquipmentDetailProps>("equipment-detail.json");
}

export function loadEquipmentFavoriteProps(): EquipmentFavoriteProps {
  return loadTestDataProps<EquipmentFavoriteProps>("equipment-favorite.json");
}

export function loadContactSellerValidationProps(): ContactSellerValidationProps {
  return loadTestDataProps<ContactSellerValidationProps>("contact-seller.json");
}
