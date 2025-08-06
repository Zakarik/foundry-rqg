const {StringField, ObjectField} = foundry.data.fields;

export function degatsField(base) {
    return {
        total:new StringField({initial:base}),
        moddice:new ObjectField(),
        modface:new ObjectField(),
        modbonus:new ObjectField(),
    }
}