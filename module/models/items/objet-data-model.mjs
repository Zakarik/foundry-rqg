import BaseItemDataModel from '../base-item-data-model.mjs';

export class ObjetDataModel extends BaseItemDataModel {
    static defineSchema() {
		const {SchemaField, BooleanField, NumberField} = foundry.data.fields;
        const schema = super.defineSchema();

        schema.parametres = new SchemaField({
            equipable:new BooleanField({initial:false}),
            utilisable:new BooleanField({initial:false}),
        });

        schema.wear = new BooleanField({initial:false});        
        schema.encombrement = new SchemaField({
            value:new NumberField({initial:0}),
            inferieura1:new BooleanField({initial:false}),
        });

        return schema
    }

    prepareBaseData() {}

    prepareDerivedData() {}
}