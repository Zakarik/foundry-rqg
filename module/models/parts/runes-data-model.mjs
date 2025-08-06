import { baseTotalField } from "./base-data-model.mjs";

export class RunesDataModel extends foundry.abstract.DataModel {
	static defineSchema() {
    const {SchemaField} = foundry.data.fields;
    const runes = CONFIG.RQG.RUNES;
    const elementaires = runes.elementaire;
    const pouvoirs = runes.pouvoir;
    let elementaire = {};
    let pouvoir = {};

    for(let e of elementaires) {
      elementaire[e] = new SchemaField(baseTotalField());
    }

    for(let p of pouvoirs) {
      pouvoir[p] = new SchemaField(baseTotalField());
    }

    let data = {
      elementaire:new SchemaField(elementaire),
      pouvoir:new SchemaField(pouvoir),
    };

    return data;
  }
}