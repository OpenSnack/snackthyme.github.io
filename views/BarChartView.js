import * as d3 from 'd3';

import {View} from './View.js';

export class BarChartView extends View {
    constructor(model, svg, parent, params) {
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
                    width: 0.9,
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

        this.thresholds = [
            {name: 'off', calcFunction: null},
            {
                name: 'ontable',
                calcFunction: (y) => this.visibleHeight() * (this.dims[this.orientation()]['off'].top - 0.35)
            },
            {
                name: 'focused',
                calcFunction: (y) => this.visibleHeight() * (this.dims[this.orientation()]['off'].top - 0.15)
            }
        ];

        this.screenHeightRatio = 1;

        if (params && params.maskID) {
            this.maskID = params.maskID;
        }

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
            .attr('transform', `translate(0, ${dims.top * this.svg.height()})`);

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold * 1.5]).clamp(true);
        this.yScale = d3.scaleBand().domain(this.model.data.map((rowDict) => rowDict.ID));

        this.chart.selectAll('.svg-bar-chart-bar')
          .data(this.model.data.slice(0, this._numBars), (d) => d.id)
          .enter()
          .append('rect')
            .attr('class', 'svg-bar-chart-bar')
            .attr('mask', (d, i) => `url(#${this.maskID}-${i})`);

        this.buildGradient();

        this.update(window.scrollY);
    }

    update(trigger) {
        const view = this;
        const changed = this.updateState(window.scrollY); // do things that need to know the state AFTER this

        if (changed && Object.values(changed).includes('focused')) {
            this.chart
                .transition()
                .duration(500)
                .attrTween('transform', () => {
                    // A D V A N C E D  T A C T I C S
                    let source = Number(this.chart.attr('transform').split(',')[1].trim().slice(0, -1));

                    return (t) => {
                        let dest = this.chartTopPosition(window.scrollY);
                        let inter = d3.interpolate(source, dest);
                        return `translate(0, ${inter(t)})`;
                    };
                });
        } else {
            this.chart.attr('transform', `translate(0, ${this.chartTopPosition(window.scrollY)})`);
        }

        const dims = this.dims[this.orientation()][this._state];

        if (changed || trigger === 'resize') {
            const chartWidth = this.svg.width() * dims.width;
            const chartHeight = this.svg.height() * dims.height;
            const centerLeftOffset = (this.svg.width() - chartWidth) / 2;
            const barRight = centerLeftOffset + chartWidth;

            this.xScale.rangeRound([0, chartWidth]);
            this.yScale.range([0, chartHeight])
                .padding(this._state === 'focused' ? 0.05 : 0);

            this.gradient
                .attr('x1', centerLeftOffset)
                .attr('x2', barRight);

            this.chart.selectAll('.svg-bar-chart-bar')
                .transition()
                .duration(500)
                .attr('x', centerLeftOffset)
                .attr('y', (d) => this.yScale(d.ID))
                .attr('height', this.yScale.bandwidth())
                .attr('width', (d) => {
                    if (this._state === 'off') {
                        return 0;
                    }
                    return this.xScale(this.barValue(d));
                })
                .attr('fill', 'url(#svg-bar-chart-bar-gradient)');
        }
    }

    chartTopPosition(scrollY) {
        let fixedTop = this.dims[this.orientation()]['off'].top * this.visibleHeight();
        return this._state === 'focused' ? fixedTop : fixedTop - scrollY;
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
            .attr('stop-color', 'rgba(255,255,255, 0.5)');

        this.gradient.append('stop')
            .attr('offset', '67%')
            .attr('stop-color', 'rgba(255,255,255, 1)');

        this.gradient.append('stop')
            .attr('offset', '67%')
            .attr('stop-color', 'rgba(174,76,227, 1)');

        this.gradient.append('stop')
            .attr('offset', '95%')
            .attr('stop-color', 'rgba(174,76,227, 1)');

        this.gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgba(174,76,227, 0)');
    }
}
