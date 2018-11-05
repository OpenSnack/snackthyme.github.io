import * as d3 from 'd3';

import {View} from './View.js';

export class TooltipView extends View {
    constructor(model, container, parent) {
        super(model, container, parent);

        this._months = 6;
    }

    init(callback) {
        this.createContainers();

        this.xScale = d3.scaleLinear()
            .domain([0, this._months]);

        this.yScale = d3.scaleLinear();

        this.path = this.chart
          .append('path')
            .classed('tooltip-chart-line', true);

        this.update({});
    }

    update(params) {
        const {trigger} = params;

        if (trigger === 'tooltipEnd') {
            this.container
                .style('top', null)
                .style('left', null);
        } else if (trigger && trigger.startsWith('tooltip')) {
            this.updatePosition();

            if (!trigger.startsWith('tooltipMove')) {
                this.updateData();
            }
        }
    }

    updatePosition() {
        const cursorPadding = 10;
        const origin = this.model.tooltipOrigin();
        const box = this.container.node().getBoundingClientRect();

        this.container
            .style('left', `${origin[0] - box.width / 2}px`)
            .style('top', `${origin[1] - box.height - cursorPadding}px`);
    }

    updateData() {
        const data = this.model.currentTooltipData();

        if (data) {
            this.title.text(data.properties.name);
            this.value.text(Math.round(data.currentRating * data.percent));

            const growth = Math.round((data.currentRating - Number(data.Rating)) * data.percent);
            const sign = Math.sign(growth) >= 0 ? '+' : '';
            this.growth.text(`(${sign}${growth})`);

            const chartRect = this.chart.node().getBoundingClientRect();
            const maxGrowth = this.model.maxGrowth();
            this.xScale.range([0, chartRect.width]);
            this.yScale
                .domain([0, maxGrowth].sort())
                .range([chartRect.height, 0]);

            const line = d3.line()
                .x((d, i) => this.xScale(i))
                .y((d) => this.yScale(d))
                .curve(d3.curveNatural);

            const pathData = data.timePoints[data.index].map((point) => point * growth);

            this.path
                .datum(pathData)
                .attr('d', line);
        }
    }

    createContainers() {
        this.chart = this.container
          .append('svg')
            .attr('id', 'tooltip-chart');

        const textContainer = this.container
          .append('div')
            .attr('id', 'tooltip-text-container');

        this.title = textContainer
          .append('div')
            .attr('id', 'tooltip-title');

        const valueContainer = textContainer
          .append('div')
            .attr('id', 'tooltip-value-container');

        this.value = valueContainer
          .append('div')
            .attr('id', 'tooltip-value');

        this.growth = valueContainer
          .append('div')
            .attr('id', 'tooltip-growth');
    }
}
