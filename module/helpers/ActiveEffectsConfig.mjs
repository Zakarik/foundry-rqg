import { 
    generateEffectsList,
} from "./common.mjs";

export async function RQGActiveEffectsConfig(sheet, html, context) {
	const data = sheet.document.system;
	const itm = sheet.document.parent;
	const equipable = ['objet'].includes(itm.type);
	const utilisable = ['objet'].includes(itm.type);

	const query = $(html);
	const detailsTab = query.find('.tab[data-tab=details]');

	detailsTab.find('input[name=disabled]').parents('div.form-group').remove();
	detailsTab.find('input[name=transfer]').parents('div.form-group').remove();

	if(equipable) {
		const isChecked = data.equipe === true ? 'checked' : '';
		const $inputEquipable = $(`
			<div class='form-group'>
			<label for='ActiveEffectConfig-Item-${itm.id}-ActiveEffect-${sheet.document.id}-equipe'>${game.i18n.localize('RQG.EFFECTS.Equipable')}</label>
			<input type="checkbox" name="system.equipe" ${isChecked} id='ActiveEffectConfig-Item-${itm.id}-ActiveEffect-${sheet.document.id}-equipe' />
			</div>
			`);

		detailsTab.find('div.form-group.statuses').before($inputEquipable);
	}

	if(utilisable) {
		const isChecked = data.active === true ? 'checked' : '';
		const $inputUtilisable = $(`
			<div class='form-group'>
			<label for='ActiveEffectConfig-Item-${itm.id}-ActiveEffect-${sheet.document.id}-utilisable'>${game.i18n.localize('RQG.EFFECTS.Utilisable')}</label>
			<input type="checkbox" name="system.active" ${isChecked} id='ActiveEffectConfig-Item-${itm.id}-ActiveEffect-${sheet.document.id}-utilisable' />
			</div>
			`);

		detailsTab.find('div.form-group.statuses').before($inputUtilisable);
	}

	if (!query.find('#effect-key-options').length) {
		const options = generateEffectsList().effects;
		const loc = generateEffectsList().loc;
		const datalist = $('<datalist id="effect-key-options"></datalist>');
		options.forEach((opt) => datalist.append(`<option value="${opt}">${game.i18n.localize(loc[opt])}</option>`));
		query.append(datalist);
	}

	query.find('.key input').each((index, el) => {
		const $el = $(el);
		const name = $el.attr('name');
		const value = $el.val();

		const $newInput = $(`<input type="text" name="${name}" value="${value}" list="effect-key-options" style='line-height:16px' />`);
		$el.replaceWith($newInput);
	});

	query.find('footer button[type=submit]').click(ev => {
		let update = {};
		
		if(equipable) {
			const eqp = detailsTab.find('input[type=checkbox][name="system.equipe"]');

			update[eqp.attr('name')] = eqp.is(':checked');
		}

		if(utilisable) {
			const act = detailsTab.find('input[type=checkbox][name="system.active"]');

			update[act.attr('name')] = act.is(':checked');
		}

		if(!foundry.utils.mergeObject(update)) sheet.document.update(update);
	});
};