import * as d3 from 'd3';

import {View} from './View.js';

export class FinalView extends View {
    constructor(model, container, parent, params) {
        super(model, container, parent);

        this.thresholds = [
            {name: 'off', calcFunction: null},
            {
                name: 'on',
                calcFunction: () => this.visibleHeight() * 2
            }
        ];
    }

    topPoints() {
        return [
            {
                point: () => this.parent.container.node().getBoundingClientRect().height -
                                this.container.node().getBoundingClientRect().height / 3,
                major: true
            }
        ];
    }

    init(callback) {

    }

    update(params) {
        const changed = this.updateState(window.scrollY);

        this.container.style('opacity', this._state === 'on' ? 1 : 0);
    }
}
