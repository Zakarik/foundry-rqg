export default class BaseItemDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
		const {HTMLField, SchemaField, NumberField} = foundry.data.fields;

        return {
            description:new HTMLField({initial:""}),
            cout:new SchemaField({                
                roues:new NumberField({initial:0}),
                lunars:new NumberField({initial:0}),
                clacks:new NumberField({initial:0}),
                bolgs:new NumberField({initial:0}),
            }),
        }
    }
}
