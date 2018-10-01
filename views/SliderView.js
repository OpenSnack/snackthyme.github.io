import * as d3 from 'd3';
import * as noUiSlider from 'nouislider';

import {View} from './View.js';

export class SliderView extends View {
    constructor(model, container, parent) {
        super(model, container, parent);

        this.dims = {
            landscape: {
                width: 0.5,
                scrollTop: 0.6,
                top: 0.8
            },
            portrait: {
                width: 0.9,
                scrollTop: 0.6,
                top: 0.8
            }
        };

        this.thresholds = [
            {name: 'off', calcFunction: null},
            {
                name: 'focused',
                calcFunction: (y) => window.innerHeight * (this.dims[this.orientation()].scrollTop - 0.15)
            }
        ];

        this._state = 'off';
    }

    init(callback) {
        noUiSlider.create(this.container.node(), {
            start: [0],
            range: {
                'min': -100,
                'max': 100
            }
        });

        this.update();
    }

    update(trigger) {
        const changed = this.updateState(window.scrollY); // do things that need to know the state AFTER this
        const dims = this.dims[this.orientation()];

        const sliderWidth = window.innerWidth * dims.width;
        const sliderTop = window.innerHeight * dims.top;
        const centerLeftOffset = (window.innerWidth - sliderWidth) / 2;

        this.container
            .style('left', centerLeftOffset)
            .style('top', sliderTop)
            .style('width', sliderWidth);

        if (changed) {
            this.container
                .transition()
                .duration(500)
                .style('opacity', this._state === 'off' ? 0 : 1)
                .attr('disabled', this._state === 'off' ? true : null);
        }
    }
}
