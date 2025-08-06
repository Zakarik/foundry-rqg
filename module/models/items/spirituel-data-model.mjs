import SortDataModel from './sort-data-model.mjs';

export class SpirituelDataModel extends SortDataModel {
    static defineSchema() {
        const schema = super.defineSchema();
		const {BooleanField} = foundry.data.fields;

        schema.variable = new BooleanField({initial:false});

        return schema;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {}
}