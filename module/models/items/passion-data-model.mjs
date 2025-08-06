export class PassionDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
		const {HTMLField, NumberField} = foundry.data.fields;

        return {
            value:new NumberField({initial:0}),
            description:new HTMLField({initial:""}),
        }
    }

    prepareBaseData() {}

    prepareDerivedData() {}
}