import { baseTotalField } from "./base-data-model.mjs";
import { valueTotalField } from "./value-data-model.mjs";

export class LocalisationsDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
    const {SchemaField, NumberField} = foundry.data.fields;
    const loc = CONFIG.RQG.localisations;
    let data = {};

    for(let l of loc) {
      data[l] = new SchemaField({
        loc:new SchemaField({
          min:new NumberField({initial:CONFIG.RQG.DATA.localisations[l].min}),
          max:new NumberField({initial:CONFIG.RQG.DATA.localisations[l].max}),
        }),
        armure:new SchemaField(baseTotalField()),
        pv:new SchemaField(valueTotalField()),
      });
    }

    return data;
  }
}