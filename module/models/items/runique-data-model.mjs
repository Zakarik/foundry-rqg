import SortDataModel from './sort-data-model.mjs';

export class RuniqueDataModel extends SortDataModel {
    static defineSchema() {
        const schema = super.defineSchema();

		const {SchemaField, BooleanField, StringField} = foundry.data.fields;
        const elementaires = CONFIG.RQG.RUNES.elementaire;
        const pouvoirs = CONFIG.RQG.RUNES.pouvoir;
        const concat = [].concat(elementaires, pouvoirs);

        let affinites = {};

        for(let a of concat) {
            affinites[a] = new BooleanField({initial:false});
        }

        schema.variable = new BooleanField({initial:false});
        schema.affinites = new SchemaField(affinites);
        schema.culte = new StringField({initial:""});

        return schema;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {}
}