
import { baseTotalField } from "./base-data-model.mjs";
const {SchemaField, ArrayField} = foundry.data.fields;

export class cmpField {
  constructor() {
    this.data = {};
  }

  prepare(type='cmp') {
    const cmp = type === 'wpn' ? CONFIG.RQG.ARMES : CONFIG.RQG.COMPETENCES;
    const data = CONFIG.RQG.DATA.competences;

    for(let c in cmp) {
      let listCmp = {};

      for(let d of cmp[c]) {
        const isRepeat = data?.[d]?.repeat ?? false;

        if(isRepeat) {
          listCmp[d] = new SchemaField({
            repeat:new ArrayField(new SchemaField(baseTotalField(data?.[d]?.base ?? 0, data?.[d]?.base ?? 0, true, false, true))),
          });
        }
        else listCmp[d] = new SchemaField(baseTotalField(data?.[d]?.base ?? 0, data?.[d]?.base ?? 0, false, false, true));
      }

      if(type === 'wpn') listCmp['custom'] = new SchemaField({
        list:new ArrayField(new SchemaField(baseTotalField(0, 0, true, true, true))),
      });

      this.data[c] = new SchemaField(foundry.utils.mergeObject(baseTotalField(), {
        list:new SchemaField(listCmp),
      }));
    }
  }

  getData() {
    return this.data;
  }
}