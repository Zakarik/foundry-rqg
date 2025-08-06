const {NumberField, ObjectField, StringField, BooleanField} = foundry.data.fields;

export function baseTotalField(base=10, total=10, withLabel=false, withCondition=false, withId=false) {
    let data = {
        mod:new ObjectField({}),
        base:new NumberField({initial:base}),
        total:new NumberField({initial:total}),
    };

    if(withLabel) {
        data.label = new StringField();
        data.unlocked = new BooleanField({initial:false});
    }
    if(withCondition) data.condition = new BooleanField({initial:false});
    if(withId) data._id = new StringField({initial:""});

    return data;
}