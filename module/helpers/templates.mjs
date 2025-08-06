/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
const { loadTemplates } = foundry.applications.handlebars

export const preloadHandlebarsTemplates = async function() {

  const path = `systems/runequest-glorantha/templates`;

  const templateParts = [
    `${path}/actors/parts/caracteristique.html`,
    `${path}/actors/parts/localization.html`,
    `${path}/actors/parts/valueWithMax.html`,
    `${path}/actors/parts/valueWithoutMax.html`,
    `${path}/actors/parts/hiddenBox.html`,
    `${path}/actors/parts/hiddenWpn.html`,
    `${path}/actors/parts/melee.html`,
    `${path}/actors/parts/distance.html`,
    `${path}/actors/parts/magie.html`,
  ];

  const templateMainParts = [
    `${path}/parts/deployBtn.html`,
    `${path}/parts/button.html`,
    `${path}/parts/effects.html`,
    `${path}/parts/cmd.html`,
  ]

  const templatePaths = templateParts.concat(templateMainParts);

  // Load the template parts
  return loadTemplates(templatePaths);
};