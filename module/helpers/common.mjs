export function getDefaultImg(type) {
  let result = "";

  switch(type) {
    case 'armedistance':
      result = "systems/runequest-glorantha/assets/distance.svg";
      break;
    case 'armecontact':
      result = "systems/runequest-glorantha/assets/melee.svg";
      break;
    case 'armure':
      result = "systems/runequest-glorantha/assets/armor.svg";
      break;
    case 'culte':
      result = "systems/runequest-glorantha/assets/culte.svg";
      break;
    case 'langue':
      result = "systems/runequest-glorantha/assets/langue.svg";
      break;
    case 'magierunique':
      result = "systems/runequest-glorantha/assets/magierunique.svg";
      break;
    case 'magiespirituelle':
      result = "systems/runequest-glorantha/assets/magiespirituelle.svg";
      break;
    case 'passion':
      result = "systems/runequest-glorantha/assets/passion.svg";
      break;
    case 'passion':
      result = "systems/runequest-glorantha/assets/passion.svg";
      break;
    case 'sorcellerie':
      result = "systems/runequest-glorantha/assets/sorcellerie.svg";
      break;
    default:
      result = "icons/svg/item-bag.svg";
      break;
  }

  return result;
}

export function capitalizeFirstLetter(string) {
    const first = (string?.charAt(0) ?? '').toUpperCase();
    const rest = string?.slice(1) ?? '';
  
    return first + rest;
}

export function sumObject(object) {  
    return Object.values(object).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
}

export function limitMax(data) {
    const value = data.value;
    const max = data.total;

    if(value > max) {
        Object.defineProperty(data, 'value', {
            value: max,
            writable:true,
            enumerable:true,
            configurable:true
        });
    }
}

export function setBase(data, base) {    
    Object.defineProperty(data, 'base', {
        value: base,
        writable:true,
        enumerable:true,
        configurable:true
    });
}

export function setTotal(data, total) {    
    Object.defineProperty(data, 'total', {
        value: total,
        writable:true,
        enumerable:true,
        configurable:true
    });
}

export function getValue(document, path) {
  let currentValue = document;

  path.split('.').forEach(key => {
      currentValue = currentValue[key];
  });

  return currentValue;
}

export function prepareMenu(html) {
    $(html).find('nav a i').removeClass('fa-solid fa-check');
    $(html).find('nav a.active i').addClass('fa-solid fa-check');
  
    html.find('nav a').click(async ev => {
        const tgt = $(ev.currentTarget);
        $(html).find('nav a i').removeClass('fa-solid fa-check');
        tgt.find('i').addClass('fa-solid fa-check');
    });
}

export async function confirmationDialog(type='delete', label='') {
  let title = label ? label : game.i18n.localize("RQG.DIALOG.Confirmation");
  let content = '';

  switch(type) {
    case 'delete':
      content = game.i18n.localize("RQG.DIALOG.ConfirmationSuppression");
      break;

    case 'date':
      content = game.i18n.localize("RQG.DIALOG.ConfirmationDate");
      break;
  }

  const confirmation = await foundry.applications.api.DialogV2.confirm({
    window:{
      title
    },
    classes:['rqg'],
    content,
  });

  return new Promise(resolve => {
    setTimeout(() => {
      resolve(
        confirmation
      );
    }, 0);
  });
};

export function calcMod(value, niv=1, lessIsWorst=true) {
  let result = 0;
  result += Math.floor((value-9)/4);

  if(niv === 2) {
    if(result < 0) result += 1;
    else if(result > 0) result -= 1;
  }

  return lessIsWorst ? result : inverserSigne(result);
}

export function autocalcAtkWpn(actor, weapon) {
  const allCmp = actor.system.allCmpWpn;
  const cmp = weapon.system.competence;
  let result = 0;

  result = allCmp?.[cmp?.id]?.total ?? 0;
  
  if(cmp?.half) result = Math.ceil(result/2);

  return result;  
}

function inverserSigne(nombre) {
  return -nombre;
}

export function generateEffectsList() {
  const baseTRA = `RQG.EFFECTS`;
  const effects = [];
  let loc = {};

  for(let c of CONFIG.RQG.caracteristiques) {
    effects.push(`system.caracteristiques.${c}.mod.effets`);
    loc[`system.caracteristiques.${c}.mod.effets`] = game.i18n.localize(`${baseTRA}.${capitalizeFirstLetter(c)}`)
  }

  effects.push(`system.pv.mod.effets`);
  loc['system.pv.mod.effets'] = game.i18n.localize(`${baseTRA}.PV`);

  effects.push(`system.magies.points.mod.effets`);
  loc['system.magies.points.mod.effets'] = game.i18n.localize(`${baseTRA}.PM`);
  
  for(let l of CONFIG.RQG.localisations) {
    effects.push(`system.localisations.${l}.pv.mod.effets`);
    loc[`system.localisations.${l}.pv.mod.effets`] = game.i18n.localize(`${baseTRA}.${capitalizeFirstLetter(l)}PV`);
  
    effects.push(`system.localisations.${l}.armure.mod.effets`);
    loc[`system.localisations.${l}.armure.mod.effets`] = game.i18n.localize(`${baseTRA}.${capitalizeFirstLetter(l)}Armure`);
  }

  effects.push(`system.rangaction.tai.mod.effets`);
  loc['system.rangaction.tai.mod.effets'] = game.i18n.localize(`${baseTRA}.Ratai`);

  effects.push(`system.rangaction.dex.mod.effets`);
  loc['system.rangaction.dex.mod.effets'] = game.i18n.localize(`${baseTRA}.Radex`);

  effects.push(`system.guerison.mod.effets`);
  loc['system.guerison.mod.effets'] = game.i18n.localize(`${baseTRA}.Guerison`);

  effects.push(`system.vitesse.mod.effets`);
  loc['system.vitesse.mod.effets'] = game.i18n.localize(`${baseTRA}.Vitesse`);

  effects.push(`system.vitesse.mod.effets`);
  loc['system.vitesse.mod.effets'] = game.i18n.localize(`${baseTRA}.Vitesse`);

  for(let r of CONFIG.RQG.RUNES.elementaire) {
    effects.push(`system.runes.elementaire.${r}.mod.effets`);
    loc[`system.runes.elementaire.${r}.mod.effets`] = game.i18n.localize(`${baseTRA}.${capitalizeFirstLetter(r)}`)
  }

  for(let r of CONFIG.RQG.RUNES.pouvoir) {
    effects.push(`system.runes.pouvoir.${r}.mod.effets`);
    loc[`system.runes.pouvoir.${r}.mod.effets`] = game.i18n.localize(`${baseTRA}.${capitalizeFirstLetter(r)}`)
  }

  effects.push(`system.magies.spirituelles.limitecha.mod.effets`);
  loc['system.magies.spirituelles.limitecha.mod.effets'] = game.i18n.localize(`${baseTRA}.LimiteCha`);

  effects.push(`system.magies.sorcelleries.intlibre.mod.effets`);
  loc['system.magies.sorcelleries.intlibre.mod.effets'] = game.i18n.localize(`${baseTRA}.IntLibre`);

  return {
    effects:effects,
    loc:loc,
  }
}

/**
 * Fetches the embedded document representing the containing HTML element
 *
 * @param {HTMLElement} target    The element subject to search
 * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
 */
export function getEmbeddedDocument(actor, target) {
  if(!target) return;
  
  const docRow = target.closest('[data-document-class]');
  if (docRow.dataset.documentClass === 'Item') {
    return actor.items.get(docRow.dataset.itemId);
  } else if (docRow.dataset.documentClass === 'ActiveEffect') {
    const parent =
      docRow.dataset.parentId === actor.id
        ? actor
        : actor.items.get(docRow?.dataset.parentId);
    return parent.effects.get(docRow?.dataset.effectId);
  } else return console.warn('Impossible de trouver la classe du document');
}

export function getArrayDocument(actor, target) {  
  const data = target.dataset;
  let array = [];
  let path = ``;

  switch(data.type) {
    case 'competences':
      array = actor.system[data.type][data.main].list[data.cmp].repeat;
      path = `system.${data.type}.${data.main}.list.${data.cmp}.repeat`;
      break;

    case 'armes':
      array = actor.system[data.type][data.cmp].list.custom.list;
      path = `system.${data.type}.${data.cmp}.list.custom.list`;
      break;
  }

  return {
    array,
    path,
  };
}

export function toggleEffects(root, effects, toggle) {
  let update = [];
  
  for(let e of effects) {
    update.push({
      _id:e.id,
      disabled:toggle,
    })
  }

  root.updateEmbeddedDocuments('ActiveEffect', update);
}

export function commonHTML(html) {
  html.find('.hoverItem').mouseenter(async ev => {
    const tgt = $(ev.currentTarget);
    const parent = tgt.parent();
    const tgtLine = parent.width();
    const tgtParentParent = tgt.parent().parent();
    const sibling = tgt.siblings('div.hovered');
    sibling.css('display', 'grid');
    sibling.css('width', `${tgtLine-4}px`);
    

    if(!tgtParentParent.hasClass('tab')) {
      sibling.css('left', `-${parseInt(tgtParentParent.css('padding'))+1}px`);
    }
    else {
      sibling.css('margin-top', `${parseInt(parent.css('padding'))}px`);
      sibling.css('left', `-1px`);
    }
  });

  html.find('.withHover').mouseleave(async ev => {
    const tgt = $(ev.currentTarget);
    const sibling = tgt.children('div.hovered');

    sibling.css('display', 'none');
  });

  html.find('i.switch').mouseenter(async ev => {
    const tgt = $(ev.currentTarget);
    let toAdd = '';
    let toRemove = '';

    if(tgt.hasClass('fa-regular')) {
      toRemove = 'fa-regular';
      toAdd = 'fa-solid';
    } else {
      toRemove = 'fa-solid';
      toAdd = 'fa-regular';
    }

    tgt.removeClass(toRemove);
    tgt.addClass(toAdd);
  });

  html.find('i.switch').mouseleave(async ev => {
    const tgt = $(ev.currentTarget);
    let toAdd = '';
    let toRemove = '';

    if(tgt.hasClass('fa-regular')) {
      toRemove = 'fa-regular';
      toAdd = 'fa-solid';
    } else {
      toRemove = 'fa-solid';
      toAdd = 'fa-regular';
    }

    tgt.removeClass(toRemove);
    tgt.addClass(toAdd);
  });
  
  html.find('span.clickable[data-action="onRoll"]').on({
    mouseenter: function () {
      const $span = $(this);
  
      // Évite d'ajouter plusieurs fois l'icône
      if ($span.find('.fa-dice-d10').length === 0) {
        const $icon = $('<i class="fa-solid fa-dice-d10" style="margin-left:2px;"></i>');
        $span.append($icon);
      }
    },
    mouseleave: function () {
      $(this).find('.fa-dice-d10').remove();
    }

  });

  html.find('span.clickable[data-action="onRollSpecial"]').on({
    mouseenter: function () {
      const $span = $(this);
  
      // Évite d'ajouter plusieurs fois l'icône
      if ($span.find('.fa-dice-d10').length === 0) {
        const $icon = $('<i class="fa-solid fa-dice-d10" style="margin-left:2px;"></i>');
        $span.append($icon);
      }
    },
    mouseleave: function () {
      $(this).find('.fa-dice-d10').remove();
    }

  });

  html.find('a.clickable[data-action="onRollSpecial"]').on({
    mouseenter: function () {
      const $a = $(this);
  
      // Évite d'ajouter plusieurs fois l'icône
      if ($a.find('.fa-dice-d10').length === 0) {
        const $icon = $('<i class="fa-solid fa-dice-d10" style="margin-left:2px;"></i>');
        $a.append($icon);
      }
    },
    mouseleave: function () {
      $(this).find('.fa-dice-d10').remove();
    }
  });
}

export function countTrueDifferences(objA, objB) {
  let totalTrue = 0;
  let differences = 0;

  for (const section in objB) {
    const bSection = objB[section] || {};
    const aSection = objA[section] || {};

    for (const key in bSection) {
      if (bSection[key] === true) {
        totalTrue++;
        if (aSection[key] !== true) {
          differences++;
        }
      }
    }
  }

  return { totalTrue, differences };
}

export function calcSorcellerie(actor, item, data={}) {
  const actorRunes = actor.system.magies.sorcelleries.runes;
  const itemRunes = item.system.runes;
  const count = countTrueDifferences(actorRunes, itemRunes);

  const basePoints = parseInt(count.totalTrue, 10) || 0;
  const mod = parseInt(data?.mod, 10) || 0;

  let total = basePoints + count.differences;
  total += count.differences ? mod*2 : mod;

  return total;
}