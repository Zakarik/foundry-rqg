export default class SortDataModel extends foundry.abstract.TypeDataModel {
    static defineSchema() {
		const {HTMLField, NumberField} = foundry.data.fields;

        return {
            description:new HTMLField({initial:""}),
            points:new NumberField({initial:0}),
        }
    }

    prepareBaseData() {
    }

    prepareDerivedData() {}
}