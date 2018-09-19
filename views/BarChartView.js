import * as d3 from 'd3';

import {View} from './View.js';

export class BarChartView extends View {
    constructor(model, svg, parent) {
        super(model, svg, parent);

        this.dims = {
            landscape: {
                width: 0.5,
                top: 0.6
            },
            portrait: {
                width: 0.9,
                top: 0.6
            }
        };
    }

    init(callback) {
        const dims = this.dims[this.orientation()];
        this.chart = this.svg
          .append('g')
            .attr('transform', `translate(0, ${dims.top * this.svg.screenHeight()})`);
    }

    update(scrollY) {

    }
}
