import SortDataModel from './sort-data-model.mjs';
import { 
  calcSorcellerie,
} from '../../helpers/common.mjs';

export class SorcellerieDataModel extends SortDataModel {
    static defineSchema() {
        const schema = super.defineSchema();
		const {BooleanField, SchemaField, NumberField} = foundry.data.fields;        

        let sorcellerie = {
            elementaire:{},
            pouvoir:{},
            forme:{},
            technique:{}
        };

        for(let s in CONFIG.RQG.SORCELLERIE) {
            let sub = {};

            for(let p of CONFIG.RQG.SORCELLERIE[s]) {
                sub[p] = new BooleanField({initial:false});
            }

            sorcellerie[s] = new SchemaField(sub);
        }

        schema.runes = new SchemaField({
            elementaire:sorcellerie.elementaire,
            pouvoir:sorcellerie.pouvoir,
            forme:sorcellerie.forme,
            technique:sorcellerie.technique,
        });

        schema.maitrise = new NumberField({initial:0});

        return schema;
    }

    get allRunes() {  
        const { elementaire = {}, pouvoir = {}, forme = {}, technique = {} } = this.runes ?? {};

        return {
            ...elementaire,
            ...pouvoir,
            ...forme,
            ...technique
        };
    }

    get listRunes() {
        const runes = Object.keys(this.allRunes).filter(rune => this.allRunes[rune]);

        return runes;
    }
    
    get item() {
        return this.parent;
    }

    get actor() {
        return this.item.actor;
    }

    prepareBaseData() {
    }

    prepareDerivedData() {
        const runes = this.runes ?? {};
        const runesActives = Object.values(runes).reduce((count, category) => {
          return count + Object.values(category).filter(Boolean).length;
        }, 0);
      
        this.points = this.actor ? calcSorcellerie(this.actor, this.item) : runesActives;
    }
}