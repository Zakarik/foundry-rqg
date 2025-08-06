const {NumberField, ObjectField} = foundry.data.fields;

export function valueTotalField(base=10, total=10) {
    return {
        mod:new ObjectField({}),
        base:new NumberField({initial:base}),
        total:new NumberField({initial:total}),
        value:new NumberField({initial:total}),
    }
}