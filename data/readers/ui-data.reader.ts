import { loadJson, resolveDataPath } from "../../core/utils/file.util.js";

const DEFAULT_TESTDATA_DIR = "data/testdata";
const TESTDATA_ENV = "TESTDATA_PATH";

function loadTestDataProps<T>(filename: string): T {
  const path = resolveDataPath(DEFAULT_TESTDATA_DIR, filename, TESTDATA_ENV);
  return loadJson<T>(path);
}

import type { CreateEquipmentStaticData } from "../props/create-equipment.props.js";
import type { LoginProps } from "../props/login.props.js";
import type { ListingsProps } from "../props/listings.props.js";
import type { CustomAttributesProps } from "../props/custom-attributes.props.js";

// Add loader functions here as you add {module}.props.ts + {module}.json files.

/** Only the fields `data/factories/create-equipment.factory.ts` can't source live — see `CreateEquipmentStaticData`. */
export function loadCreateEquipmentProps(): CreateEquipmentStaticData {
  return loadTestDataProps<CreateEquipmentStaticData>("create-equipment.json");
}

export function loadLoginProps(): LoginProps {
  return loadTestDataProps<LoginProps>("login.json");
}

export function loadListingsProps(): ListingsProps {
  return loadTestDataProps<ListingsProps>("listings.json");
}

export function loadCustomAttributesProps(): CustomAttributesProps {
  return loadTestDataProps<CustomAttributesProps>("custom-attributes.json");
}
