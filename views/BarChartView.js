import * as d3 from 'd3';

import {View} from './View.js';

export class BarChartView extends View {
    constructor(model, svg, parent) {
        super(model, svg, parent);

        this.dims = {
            landscape: {
                off: {
                    width: 0,
                    height: 0.7,
                    top: 0.6
                },
                ontable: {
                    width: 0.5,
                    height: 0.7,
                    top: 0.6
                },
                focused: {
                    width: 0.7,
                    height: 0.7,
                    top: 0.6
                }
            },
            portrait: {
                off: {
                    width: 0,
                    height: 0.7,
                    top: 0.6
                },
                ontable: {
                    width: 0.9,
                    height: 0.7,
                    top: 0.6
                },
                focused: {
                    width: 0.9,
                    height: 0.7,
                    top: 0.6
                }
            }
        };

        this._redThreshold = 5000;
        this._sliderValue = 0;
        this._state = 'off';
    }

    init(callback) {
        const dims = this.dims[this.orientation()][this._state];
        this.chart = this.svg
          .append('g')
            .attr('transform', `translate(0, ${dims.top * this.svg.screenHeight()})`);

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold]).clamp(true);
        this.yScale = d3.scaleBand().domain(this.model.data.map((rowDict) => rowDict.ID));
        this.xOverScale = d3.scaleLinear().domain([this._redThreshold, this._redThreshold * 2]).clamp(true);

        this.update(window.scrollY);
    }

    update(scrollY) {
        const changed = this.updateState(scrollY);

        const dims = this.dims[this.orientation()][this._state];
        this.chart.attr('transform', `translate(0, ${dims.top * this.svg.screenHeight()})`);

        const numBars = this.model.data.length;
        const chartWidth = this.svg.width() * dims.width;
        const chartHeight = this.svg.screenHeight() * dims.height;
        const centerLeftOffset = (this.svg.width() - chartWidth) / 2;
        const blueBarRight = centerLeftOffset + dims.width * this.svg.width() * 2/3;
        const overBarRight = centerLeftOffset + dims.width * this.svg.width() * 4/3;

        this.xScale.rangeRound([0, chartWidth * 2/3]);
        this.yScale.rangeRound([0, chartHeight]);
        this.xOverScale.rangeRound([0, overBarRight - blueBarRight]);

        this.chart.selectAll('.svg-bar-chart-bar')
          .data(this.model.data, (d) => d.id)
          .enter()
          .append('rect')
            .attr('class', 'svg-bar-chart-bar');

        this.chart.selectAll('.svg-bar-chart-bar')
            .attr('x', centerLeftOffset)
            .attr('y', (d) => this.yScale(d.ID))
            .attr('width', (d) => this.xScale(this.barValue(d)))
            .attr('height', this.yScale.bandwidth());

        this.chart.selectAll('.svg-bar-chart-over-bar')
          .data(this.model.data, (d) => d.id)
          .enter()
          .append('rect')
            .attr('class', 'svg-bar-chart-over-bar');

        this.chart.selectAll('.svg-bar-chart-over-bar')
            .attr('x', blueBarRight)
            .attr('y', (d) => this.yScale(d.ID))
            .attr('width', (d) => this.xOverScale(this.barValue(d)))
            .attr('height', this.yScale.bandwidth())
            .attr('fill', 'red');
    }

    updateState(scrollY) {
        let oldState = this._state;
        let ontableThreshold = this.svg.screenHeight() * (this.dims[this.orientation()]['off'].top - 0.3);
        let focusedThreshold = this.svg.screenHeight() * (this.dims[this.orientation()]['off'].top - 0.15);
        if (scrollY < ontableThreshold) {
            this._state = 'off';
        } else if (ontableThreshold <= scrollY && scrollY < focusedThreshold) {
            this._state = 'ontable';
        } else {
            this._state = 'focused';
        }
        return oldState !== this._state; // return true if the state changed
    }

    barValue(d) {
        let rating = Number(d.Rating);
        let ratio = Number(d.Ratio);
        return rating + this._sliderValue * rating * ratio;
    }
}
