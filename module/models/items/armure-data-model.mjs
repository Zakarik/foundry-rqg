import BaseItemDataModel from '../base-item-data-model.mjs';

export class ArmureDataModel extends BaseItemDataModel {
    static defineSchema() {
		const {HTMLField, StringField, NumberField, SchemaField, BooleanField} = foundry.data.fields;
        const schema = super.defineSchema();
        const loc = CONFIG.RQG.localisations;
        let genLoc = {};

        for(let l of loc) {
            genLoc[l] = new NumberField({initial:0});
        }

        schema.wear = new BooleanField({initial:false});
        schema.matiere = new StringField({initial:""});
        schema.type = new StringField({initial:""});
        schema.localisations = new SchemaField(genLoc);
        schema.deplacementsilencieux = new NumberField({initial:0});
        schema.encombrement = new SchemaField({
            value:new NumberField({initial:0}),
            inferieura1:new BooleanField({initial:false}),
        });

        return schema;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {}
}