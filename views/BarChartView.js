import * as d3 from 'd3';

import {View} from './View.js';
import {scrollMatchingTween} from '../scrollMatchingTween.js';

export class BarChartView extends View {
    constructor(model, container, parent, params) {
        super(model, container, parent);

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
                    top: 0.4
                },
                faded: {
                    width: 0.7,
                    height: 0.7,
                    top: 0.4
                },
                done: {
                    width: 0.7,
                    height: 0.7,
                    top: 0.4
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
                    top: 0.4
                },
                faded: {
                    width: 0.9,
                    height: 0.7,
                    top: 0.4
                },
                done: {
                    width: 0.9,
                    height: 0.7,
                    top: 0.4
                }
            }
        };

        this.thresholds = [
            {name: 'off', calcFunction: null},
            {
                name: 'ontable',
                calcFunction: () => this.visibleHeight() * (this.dims[this.orientation()]['off'].top - 0.35)
            },
            {
                name: 'focused',
                calcFunction: () => this.visibleHeight() * (this.dims[this.orientation()]['off'].top - 0.15)
            },
            {
                name: 'faded',
                calcFunction: () => this.visibleHeight()
            },
            {
                name: 'done',
                calcFunction: () => this.visibleHeight() * 1.3
            }
        ];

        this._captionParams = {
            text: 'What if you could breathe life into your data?',
            coords: {
                width: 0.7,
                top: 0.15,
                left: 0.15
            }
        };

        this.screenHeightRatio = 2;

        if (params && params.maskID) {
            this.tableMaskID = params.maskID;
        }

        this._numBars = 5;
        this._redThreshold = 5000;
        this._sliderValue = 0;
        this._state = 'off';
        this._transitioning = false;
    }

    init(callback) {
        const dims = this.dims[this.orientation()][this._state];

        this.container.style('position', 'absolute');
        this.chart = this.container
          .append('g')
            .attr('transform', `translate(0, ${dims.top * this.container.height()})`);

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold * 1.5]).clamp(true);
        this.yScale = d3.scaleBand().domain(this.model.data.map((rowDict) => rowDict.ID));

        this.caption = this.parent.container
          .append('span')
            .classed('caption', true);

        this.chart.selectAll('.svg-bar-chart-bar')
          .data(this.model.data.slice(0, this._numBars), (d) => d.id)
          .enter()
          .append('rect')
            .attr('class', 'svg-bar-chart-bar')
            .attr('mask', (d, i) => `url(#${this.tableMaskID}-${i})`)
            .on('click', (d, i) => {
                if (this._state === 'faded') {
                    this.model.setSelected(i);
                }
            });

        this.buildGradient();
        this.buildTextMasks();

        this.update({});
    }

    update(params) {
        const view = this;
        const {trigger} = params;
        const changed = this.updateState(window.scrollY); // do things that need to know the state AFTER this

        let capOpacity = this.captionOpacity(window.scrollY);
        let capTransition = changed && Object.values(changed).includes('ontable');
        this.setCaption(Object.assign({}, this._captionParams, {opacity: capOpacity, transition: capTransition}));

        const dims = this.dims[this.orientation()][this._state];

        if (changed && Object.values(changed).includes('focused')) {
            this.chart
                .transition('bar-chart-translate')
                .duration(500)
                .call(scrollMatchingTween, () => this.chartTopPosition(changed));
        } else if (!d3.active(this.chart.node(), 'bar-chart-translate')) {
            this.chart.attr('transform', `translate(-1, ${this.chartTopPosition(changed)})`);
        }

        const posParams = {
            chartWidth: this.container.width() * dims.width,
            chartHeight: this.visibleHeight() * dims.height,
        };
        posParams.centerLeftOffset = (this.container.width() - posParams.chartWidth) / 2;
        posParams.barRight = posParams.centerLeftOffset + posParams.chartWidth;

        let bars = this.chart
          .selectAll('.svg-bar-chart-bar')
          .data(this.model.currentData());

        this.xScale.rangeRound([0, posParams.chartWidth]);
        this.yScale.range([0, posParams.chartHeight])
            .padding(['focused', 'faded', 'done'].includes(this._state) ? 0.05 : 0);

        this.gradient
            .attr('x1', posParams.centerLeftOffset)
            .attr('x2', posParams.barRight);

        // on resize, just move right away
        if (trigger !== 'resize') {
            if (trigger === 'sliderMoved') {
                bars = bars.transition().duration(500);
                bars = bars.ease(d3.easeCubicOut);
            } else if (changed) {
                if (this._state === 'focused') {
                    bars = bars
                      .transition()
                      .duration(500)
                        .on('end', () => {
                            this.container
                                .style('position', 'fixed')
                                .style('top', 0);
                            this.chart.attr('transform', `translate(-1, ${this.visibleHeight() * dims.top})`);
                        });
                } else if (this._state === 'ontable') {
                    bars = bars.transition().duration(500);
                    const oldDims = this.dims[this.orientation()]['focused'];
                    this.container
                        .style('position', 'absolute')
                        .style('top', 0);
                    const startY = this.visibleHeight() * oldDims.top + window.scrollY;
                    this.chart.attr('transform', `translate(-1, ${startY})`);
                } else if (['faded', 'done'].includes(this._state)) {
                    this.container
                        .style('position', 'absolute')
                        .style('top', this.thresholds[3].calcFunction());
                } else {
                    bars = bars.transition().duration(500);
                }
            }
            this.moveBars(bars, posParams);
        } else {
            this.moveBars(bars, posParams);
        }

        // move masks around
        // if changed:
        //      if 'focused':
        //          move bar masks into place
        //          (fade out table masks) [handled by TableView]
        //              DELAY ---> set bar masks
        //                         fade in bar masks
        //      if 'ontable' or 'faded':
        //          fade out bar masks
        //              END ---> set table masks
        //              DELAY ---> (fade in table masks) [handled by TableView]
        // else if resize:
        //      if 'focused':
        //          move bar masks into place
        // else if slider move:
        //      move bar masks into place

        let nameMasks = this.chart.selectAll('.svg-bar-chart-mask-name');
        let ratingMasks = this.chart.selectAll('.svg-bar-chart-mask-rating');
        if (changed) {
            if (this._state === 'focused') {
                this.moveBarMasks(nameMasks, ratingMasks, posParams, true);
                // table masks fade out during this time
                nameMasks
                    .transition()
                    .delay(500)
                    .duration(500)
                    .attr('opacity', 1)
                    .on('start', () => {
                        this.chart
                          .selectAll('.svg-bar-chart-bar')
                            .attr('mask', (d, i) => `url(#svg-bar-chart-mask-${i})`);
                    });
                ratingMasks
                    .transition()
                    .delay(500)
                    .duration(500)
                    .attr('opacity', 1);
            } else if (this._state === 'ontable' || this._state === 'faded') {
                nameMasks
                    .transition()
                    .duration(500)
                    .attr('opacity', 0);
                ratingMasks
                    .transition()
                    .duration(500)
                    .attr('opacity', 0)
                    .on('end', () => {
                        this.chart
                          .selectAll('.svg-bar-chart-bar')
                            .attr('mask', (d, i) => `url(#${view.tableMaskID}-${i})`);
                    });
                // table masks fade in during this time
            }
        } else if (trigger === 'resize' && this._state === 'focused') {
            this.moveBarMasks(nameMasks, ratingMasks, posParams);
        } else if (trigger === 'sliderMoved') {
            this.moveBarMasks(nameMasks, ratingMasks, posParams, {ease: d3.easeCubicOut});
        }

        if (this._state === 'faded') {
            this.container.style('z-index', 998);
        } else {
            this.container.style('z-index', null);
        }
    }

    moveBars(bars, posParams) {
        bars.attr('x', posParams.centerLeftOffset)
          .attr('y', (d) => this.yScale(d.ID))
          .attr('height', this.yScale.bandwidth())
          .attr('width', (d) => {
            if (this._state === 'off') {
                return 0;
            } else if (this._state === 'ontable') {
                return this.xScale(d.Rating);
            }
            return this.xScale(d.currentRating);
          })
          .attr('fill', 'url(#svg-bar-chart-bar-gradient)')
          .attr('opacity', (d, i) => {
              if (this._state === 'faded') {
                  return i === this.model.selectedDatum().index ? 0 : 0.5;
              }
              return this._state === 'done' ? 0 : 1;
          });
    }

    moveBarMasks(nameMasks, ratingMasks, position, transition) {
        const {centerLeftOffset} = position;
        let innerPadding = this.yScale.bandwidth() / 4;

        nameMasks
            .data(this.model.currentData())
            .attr('x', centerLeftOffset + innerPadding)
            .attr('y', (d) => this.yScale(d.ID) + this.yScale.bandwidth() / 2)
            .text((d) => d.User);

        if (transition) {
            ratingMasks = ratingMasks
              .data(this.model.currentData())
              .transition()
              .duration(500)
              .ease(transition.ease || d3.easeCubic)
                .tween('text', function(d) {
                    // make rating number count up/down when value changes
                    let oldValue = this.textContent; // eslint-disable-line no-invalid-this
                    let inter = d3.interpolateRound(Number(oldValue), d.currentRating);
                    return (t) => {this.textContent = inter(t);}; // eslint-disable-line no-invalid-this
                });
        } else {
            ratingMasks.text((d) => Math.round(d.currentRating));
        }
        ratingMasks
            .attr('x', (d) => centerLeftOffset + this.xScale(d.currentRating) - innerPadding)
            .attr('y', (d) => this.yScale(d.ID) + this.yScale.bandwidth() / 2);
    }

    chartTopPosition(changed) {
        let dimsTop = this.dims[this.orientation()][this._state].top;
        let fixedTop = dimsTop * this.visibleHeight();

        if (changed && changed.from === 'ontable' && changed.to === 'focused') {
            return fixedTop + window.scrollY;
        }
        if (changed && changed.from === 'faded' && changed.to === 'focused') {
            return fixedTop + window.scrollY - this.thresholds[3].calcFunction();
        }

        return fixedTop;
    }

    captionOpacity(scrollY) {
        // fade in, then out as we go ontable -> focused -> faded
        let onPoint = this.thresholds[2].calcFunction(); // focused
        let scrollOnDiff = scrollY - onPoint;
        if (scrollOnDiff < 0) return 0;

        let fadeStartPoint = this.thresholds[3].calcFunction();
        if (scrollY < fadeStartPoint) return 1;

        let offset = this.visibleHeight() * this._captionParams.coords.top;
        let scrollFadeDiff = fadeStartPoint + offset - scrollY;
        if (scrollFadeDiff < 0) return 0;

        return scrollFadeDiff / offset;
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
            .attr('stop-color', 'rgba(255,255,255, 0.8)');

        this.gradient.append('stop')
            .attr('offset', '67%')
            .attr('stop-color', 'rgba(100,200,255, 0.8)');

        this.gradient.append('stop')
            .attr('offset', '95%')
            .attr('stop-color', 'rgba(100,200,255, 1)');

        this.gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', 'rgba(100,200,255, 0)');
    }

    buildTextMasks() {
        const defs = this.chart.select('defs');

        this.model.data.forEach((d, i) => {
            defs
              .append('mask')
                .attr('id', `svg-bar-chart-mask-${i}`)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', '100%')
                .attr('height', '100%')
              .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('fill', 'white');

            let mask = defs.select(`#svg-bar-chart-mask-${i}`);
            // username
            mask
              .append('text')
                .classed('svg-bar-chart-mask-name', true);
            // moving rating
            mask
              .append('text')
                .classed('svg-bar-chart-mask-rating', true);
        });
        // update value, x and y position elsewhere
    }
}
