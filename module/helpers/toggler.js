class Toggler {
  constructor() {
    this.toggles = this._load();
    this.hideshow = this._loadHideShow();
    this.deploy = this._loadDeploy();
  }

  init(id, html) {
    id = this._cleanId(id);
    const $html = $(html);

    $html.find('.js-toggler').each((index, element) => {
      const $el = $(element);
      const key = this._getKey(id, index);

      const visible = this.toggles.get(key);
      const hideshow = this.hideshow.get(key);
      const deploy = this.deploy.get(key);

      // Initial state: visibility toggle
      if (visible !== undefined) {
        this._getSiblings($el).toggle(visible);
        this._toggleClasses($el.find('i:first'), visible);
        if (!visible) {
          $el.find('div.btn').toggle({
            complete: () => this._setElementVisibility(id, index, element)
          });
        }
      }

      // Initial state: hide/show
      if (hideshow !== undefined) {
        if (!hideshow) {
          const $icon = $el.find('i.hideshow');
          this._getSiblings($icon.closest('.mainCMP')).toggle({
            duration: 0,
            complete: () => this._setElementHideShow(id, index, element)
          });
          $icon.closest('.mainCMP').toggleClass('retract');
          $icon.toggleClass('fa-eye-slash fa-eye');
        }
      }

      // Initial state: deploy
      if (deploy !== undefined) {
        if (deploy) {
          const $deployBtn = $el.find('a.deploy');
          this._getSiblings($deployBtn).toggle({
            duration: 0,
            complete: () => this._setElementDeploy(id, index, element)
          });
          this._toggleClassesDeploy($deployBtn, deploy);
          $deployBtn.find('p.hide').toggle({ duration: 0 });
          $deployBtn.find('p.show').toggle({ duration: 0 });
        }
      }

      // Click handlers
      $el.find('i:first').on('click', e => {
        e.preventDefault();
        const $icon = $(e.currentTarget);
        this._toggleClasses($icon);
        this._getSiblings($el).toggle({
          complete: () => this._setElementVisibility(id, index, element)
        });
        $el.find('div.btn').toggle({
          complete: () => this._setElementVisibility(id, index, element)
        });
      });

      // Deploy click
      $el.find('a.deploy').on('click', e => {
        e.preventDefault();
        const $btn = $(e.currentTarget);
        this._toggleClassesDeploy($btn);
        this._getSiblings($btn).toggle({
          complete: () => this._setElementDeploy(id, index, element)
        });
        $btn.find('p').toggle({ duration: 0 });
      });

      // Hide/show click
      $el.find('i.hideshow').on('click', e => {
        e.preventDefault();
        const $icon = $(e.currentTarget);
        this._getSiblings($icon.closest('.mainCMP')).toggle({
          complete: () => this._setElementHideShow(id, index, element)
        });
        $icon.closest('.mainCMP').toggleClass('retract');
        $icon.toggleClass('fa-eye-slash fa-eye');
      });
    });
  }

  clearForId(id) {
    id = this._cleanId(id);
    this.toggles.forEach((value, key) => {
      if (key.startsWith(id)) this.toggles.delete(key);
    });
    this._save();
  }

  clearAll() {
    this.toggles = new Map();
    this._save();
  }

  _cleanId(id) {
    return id.split('-').pop();
  }

  _getSiblings($el) {
    return $el.siblings().not('.selected');
  }

  _toggleClasses($el, forced) {
    if (forced === undefined) {
      $el.toggleClass('fa-square-plus fa-square-minus');
    } else if (forced) {
      $el.removeClass('fa-square-plus').addClass('fa-square-minus');
    } else {
      $el.addClass('fa-square-plus').removeClass('fa-square-minus');
    }
  }

  _toggleClassesDeploy($el, forced) {
    const $icon = $el.find('i');
    if (forced === undefined) {
      $icon.toggleClass('fa-arrow-up fa-arrow-down');
    } else if (forced) {
      $icon.removeClass('fa-arrow-down').addClass('fa-arrow-up');
    } else {
      $icon.addClass('fa-arrow-up').removeClass('fa-arrow-down');
    }
  }

  _setElementVisibility(id, index, element) {
    const $target = $(element).next();
    this.toggles.set(this._getKey(id, index), $target.is(':visible'));
    this._save();
  }

  _setElementDeploy(id, index, element) {
    const $deployBtn = $(element).find('a.deploy');
    const $target = $deployBtn.siblings().first();
    this.deploy.set(this._getKey(id, index), $target.is(':visible'));
    this._saveDeploy();
  }

  _setElementHideShow(id, index, element) {
    const $cmp = $(element).closest('.mainCMP');
    const $target = $cmp.siblings().first();
    this.hideshow.set(this._getKey(id, index), $target.is(':visible'));
    this._saveHideShow();
  }

  _getKey(id, index) {
    return `${id}-${index}`;
  }

  _save() {
    localStorage.setItem('rqg.togglers', JSON.stringify(Object.fromEntries(this.toggles)));
  }

  _saveDeploy() {
    localStorage.setItem('rqg.deploy', JSON.stringify(Object.fromEntries(this.deploy)));
  }

  _saveHideShow() {
    localStorage.setItem('rqg.hideshow', JSON.stringify(Object.fromEntries(this.hideshow)));
  }

  _load() {
    const data = localStorage.getItem('rqg.togglers');
    return data ? new Map(Object.entries(JSON.parse(data))) : new Map();
  }

  _loadHideShow() {
    const data = localStorage.getItem('rqg.hideshow');
    return data ? new Map(Object.entries(JSON.parse(data))) : new Map();
  }

  _loadDeploy() {
    const data = localStorage.getItem('rqg.deploy');
    return data ? new Map(Object.entries(JSON.parse(data))) : new Map();
  }
}

export default new Toggler();
