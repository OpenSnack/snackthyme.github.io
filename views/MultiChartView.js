import * as d3 from 'd3';

import {View} from './View.js';

export class MultiChartView extends View {
    constructor(model, svg, parent) {
        super(model, svg, parent);

        this.screenHeightRatio = 1;
    }
}
