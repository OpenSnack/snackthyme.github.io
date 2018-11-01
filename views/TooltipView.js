import * as d3 from 'd3';

import {View} from './View.js';

export class TooltipView extends View {
    constructor(model, container, parent) {
        super(model, container, parent);

        this._months = 7;
    }

    init(callback) {
        this.createContainers();

        this.xScale = d3.scaleOrdinal()
            .domain(Array.from({length: this._months}, (v, k) => k));

        this.yScale = d3.scaleLinear();

        // fix this stuff later

        this.container
            .style('width', 200)
            .style('height', 80);

        this.chart
            .style('height', 60);

        this.title.text('Alaska');
        this.value.text('3000');
        this.growth.text('(+200)');
        this.timePoints = Array.from(
            {length: this._months + 1},
            Math.random
        ).sort();

        this.update();
    }

    update(params) {
        const data = this.model.currentTooltipData();

        if (data) {
            this.title.text(data.properties.name);
            this.value.text(Math.round(data.currentRating * data.percent));

            const growth = Math.round((data.currentRating - Number(data.Rating)) * data.percent);
            const sign = Math.sign(growth) === 1 ? '+' : '';
            this.growth.text(`(${sign}${growth})`);
        }

        // this.xScale.range([0, this.chart.node().getBoundingClientRect().width]);
        // this.yScale.domain()
    }

    createContainers() {
        this.title = this.container
          .append('div')
            .attr('id', 'tooltip-title');

        const rowContainer = this.container
          .append('div')
            .attr('id', 'tooltip-row-container');

        const valueContainer = rowContainer
          .append('div')
            .attr('id', 'tooltip-value-container');

        this.value = valueContainer
          .append('div')
            .attr('id', 'tooltip-value');

        this.growth = valueContainer
          .append('div')
            .attr('id', 'tooltip-growth');

        this.chart = rowContainer
          .append('svg')
            .attr('id', 'tooltip-chart');
    }
}
