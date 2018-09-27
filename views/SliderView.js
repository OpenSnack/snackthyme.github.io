import * as d3 from 'd3';
import * as noUiSlider from 'nouislider';

import {View} from './View.js';

export class SliderView extends View {
    constructor(model, svg, parent) {
        super(model, svg, parent);
    }

    init(callback) {
        // noUiSlider.create(html5Slider, {
        //     start: [0],
        //     range: {
        //         'min': -100,
        //         'max': 100
        //     }
        // });
    }

    update(trigger) {

    }
}
