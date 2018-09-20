import * as d3 from 'd3';

import {View} from './View.js';

export class BarChartView extends View {
    constructor(model, svg, parent) {
        super(model, svg, parent);

        this.dims = {
            landscape: {
                off: {
                    width: 0.5,
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
                    width: 0.5,
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

        this.gradients = [
            {
                id: 'svg-bar-chart-bar-gradient',
                stops: [
                    {color: 'white', offset: '0%'},
                    {color: 'white', offset: '67%'},
                    {color: 'red', offset: '67%'},
                ],
                units: 'userSpaceOnUse'
            }
        ];

        this._numBars = 5;
        this._redThreshold = 5000;
        this._sliderValue = 0;
        this._state = 'off';
        this._transitioning = false;
    }

    init(callback) {
        const dims = this.dims[this.orientation()][this._state];
        this.chart = this.svg
          .append('g')
            .attr('transform', `translate(0, ${dims.top * this.svg.screenHeight()})`);

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold * 1.5]).clamp(true);
        this.yScale = d3.scaleBand().domain(this.model.data.map((rowDict) => rowDict.ID));

        this.chart.selectAll('.svg-bar-chart-bar')
          .data(this.model.data.slice(0, this._numBars), (d) => d.id)
          .enter()
          .append('rect')
            .attr('class', 'svg-bar-chart-bar');

        this.buildGradient();

        this.update(window.scrollY);
    }

    update(scrollY, trigger) {
        const view = this;
        const changed = this.updateState(scrollY);

        if (changed || trigger === 'resize') {
            const dims = this.dims[this.orientation()][this._state];
            this.chart.attr('transform', `translate(0, ${dims.top * this.svg.screenHeight()})`);

            const chartWidth = this.svg.width() * dims.width;
            const chartHeight = this.svg.screenHeight() * dims.height;
            const centerLeftOffset = (this.svg.width() - chartWidth) / 2;
            const barRight = centerLeftOffset + chartWidth;

            this.xScale.rangeRound([0, chartWidth]);
            this.yScale.rangeRound([0, chartHeight])
                .padding(this._state === 'focused' ? 0.05 : 0);

            this.gradient
                .attr('x1', centerLeftOffset)
                .attr('x2', barRight);

            this.chart.selectAll('.svg-bar-chart-bar')
                .each((d, i) => {
                    if (d3.active(this)) {console.log('active');}
                });

            this.chart.selectAll('.svg-bar-chart-bar')
                .transition()
                .attr('x', centerLeftOffset)
                .attr('y', (d) => this.yScale(d.ID))
                .attr('height', this.yScale.bandwidth())
                .duration(500)
                .attr('width', (d) => {
                    if (this._state === 'off') {
                        return 0;
                    }
                    return this.xScale(this.barValue(d));
                })
                .attr('fill', 'url(#svg-bar-chart-bar-gradient)');
        }
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

    buildGradient() {
        const defs = this.chart.append('defs');
        this.gradient = defs
          .append('linearGradient')
            .attr('id', 'svg-bar-chart-bar-gradient')
            .attr('gradientUnits', 'userSpaceOnUse');

        this.gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', 'white');

        this.gradient.append('stop')
            .attr('offset', '67%')
            .attr('stop-color', 'white');

        this.gradient.append('stop')
            .attr('offset', '67%')
            .attr('stop-color', 'red');

        this.gradient.append('stop')
            .attr('offset', '95%')
            .attr('stop-color', 'red');

        this.gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'red')
            .attr('stop-opacity', '0');
    }
}
