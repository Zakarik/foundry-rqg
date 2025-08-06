import { baseTotalField } from "./base-data-model.mjs";

export class CaracteristiquesDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
      return foundry.utils.mergeObject(baseTotalField(), {});
    }
}