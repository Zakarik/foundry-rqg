

export default class processRoll {
    constructor(data={
        score:0,
        mod:0,
    }) {
        this._data = data;
    }

    static TEMPLATE_TOOLTIP = 'systems/runequest-glorantha/templates/chat/tooltip.html';
    static REUSSITE = 'RQG.CHAT.Reussite';
    static REUSSITECRITIQUE = 'RQG.CHAT.ReussiteCritique';
    static REUSSITESPECIALE = 'RQG.CHAT.ReussiteSpeciale';
    static ECHEC = 'RQG.CHAT.Echec';
    static ECHECCRITIQUE = 'RQG.CHAT.EchecCritique';

    _data = {};
    _roll = [];
    _result = '';
    _tooltip = {};
    _total = 0;

    set data(data=[]) {
        this._data = data;
    }

    get data() {
        return this._data;
    }

    get difficulte(){
        return parseInt(this.data?.score ?? 0)+parseInt(this.data?.modificateur ?? 0);
    }

    get details() {
        const score = parseInt(this.data?.score ?? 0);
        const mod = parseInt(this.data?.modificateur ?? 0);
        let str = score;
        
        if(mod > 0) str += ` + ${mod}`;

        return str;
    }

    get roll() {
        return this._roll;
    }

    get result() {
        return this._result;
    }

    get tooltip() {
        return this._tooltip;
    }

    get total() {
        return this._total;
    }

    async doRoll() {
        const difficulte = this.difficulte;
        const roll = new Roll('1D100');
        await roll.evaluate();

        this._roll = roll;
        this._result = this._identifyResult(difficulte, roll.total);
        this._tooltip = this._generateTooltip(roll);
    }

    async doDmg(dmg, maximize=false) {
        const roll = new Roll(dmg);
        await roll.evaluate({maximize});
        
        this._roll = roll;
        this._tooltip = this._generateTooltip(roll);
        this._result = roll.result;
        this._total = roll.total;
    }

    _identifyResult(difficulte, roll) {
        const reussiteCritique = roll <= Math.min(95, Math.max(1, Math.round(difficulte*0.05))) ? true : false;
        const reussiteSpeciale = roll <= Math.min(95, Math.max(1, Math.round(difficulte*0.20))) ? true : false;
        const reussite = roll <= Math.min(95, Math.max(difficulte, 5)) ? true : false;
        const echecCritique = roll > 100-Math.round(((100-difficulte)*0.05)-1) || roll === 100 ? true : false;
        const echec = roll > difficulte || roll >= 96 ? true : false;
        let result = '';

        if (reussiteCritique) result = {
            txt:processRoll.REUSSITECRITIQUE,
            class:'critique',
        };
        else if (reussiteSpeciale) result = {
            txt:processRoll.REUSSITESPECIALE,
            class:'special'
        };
        else if (reussite) result = {
            txt:processRoll.REUSSITE,
            class:'success'
        };
        else if (echecCritique) result = {
            txt:processRoll.ECHECCRITIQUE,
            class:'epicfail'
        };
        else if (echec) result = {
            txt:processRoll.ECHEC,
            class:'fail'
        };
        return {
            txt:game.i18n.localize(result.txt),
            class:result.class,
        };
    }

    _generateTooltip(roll) {
        let result = `<section class='rqg-tooltip' style='display:none;'>`;

        for(let d of roll.dice) {
            result += 
                `<header class='rqg-formula'>
                    <span class='label'>${d.expression.toUpperCase()}</span>
                    <span class='value'>${d.total}</span>
                </header>`;

            result += `<ol class='rqg-dices'>`;

                for(let r of d.results) {
                    result += `<li class='die d${d.faces} ${r.active ? 'active' : 'inactive'} ${r.result === 1 ? 'min' : ''} ${r.result === d.faces ? 'max' : ''}'>${r.result}</li>`
                }

            result += `</ol>`;
        }

        result += `</section>`;

        return result;
    }
}