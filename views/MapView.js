import * as d3 from 'd3';

import {View} from './View.js';

export class MapView extends View {
    constructor(model, container, parent) {
        super(model, container, parent);

        this.dims = {
            landscape: {
                off: {
                    width: 0.7,
                    height: 0.7,
                    top: 0.1
                },
                splitbar: {
                    width: 0.7,
                    height: 0.7,
                    top: 0.1
                },
                focused: {
                    width: 0.7,
                    height: 0.5,
                    top: 0.4
                }
            },
            portrait: {
                off: {
                    width: 0.9,
                    height: 0.7,
                    top: 0.1
                },
                splitbar: {
                    width: 0.9,
                    height: 0.7,
                    top: 0.1
                },
                focused: {
                    width: 0.9,
                    height: 0.5,
                    top: 0.4
                }
            }
        };

        this.thresholds = [
            {name: 'off', calcFunction: null},
            {
                name: 'splitbar',
                calcFunction: () => this.visibleHeight()
            },
            {
                name: 'focused',
                calcFunction: () => this.visibleHeight() * 1.2
            }
        ];

        this.screenHeightRatio = 1;
        this.scrollOffset = 1.3;
        this._redThreshold = 5000;
        this._selected = -1;
    }

    init(callback) {
        this.pathGroup = this.container.append('g');
        this.model.json.features.forEach((f) => {
            this.pathGroup.append('path');
        });

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold * 1.5]).clamp(true);
        this.yScale = d3.scaleBand().domain(this.model.data.map((rowDict) => rowDict.ID));
    }

    update(params) {
        const {trigger} = params;
        const stateChanged = this.updateState(window.scrollY); // do things that need to know the state AFTER this
        const selectedChanged = this.updateSelected();

        const dims = this.dims[this.orientation()][this._state];

        const posParams = {
            chartWidth: this.container.width() * dims.width,
            chartHeight: this.visibleHeight() * dims.height,
        };
        posParams.centerLeftOffset = (this.container.width() - posParams.chartWidth) / 2;
        posParams.barRight = posParams.centerLeftOffset + posParams.chartWidth;

        this.xScale.rangeRound([0, posParams.chartWidth]);
        this.yScale.range([0, posParams.chartHeight])
            .padding(0.05);

        if (stateChanged) {
            this.pathGroup
                .transition()
                .duration(500)
                .attr('opacity', this._state === 'off' ? 0 : 1);

            let states = Object.values(stateChanged);
            if (states.includes('focused') && states.includes('splitbar')) {
                this.drawBar(posParams, true);
            } else {
                this.drawBar(posParams);
            }
        } else {
            this.drawBar(posParams);
        }
    }

    drawBar(position, transition) {
        let paths = this.pathGroup.selectAll('path');
        const datum = this.model.currentData()[this._selected];

        let previousLeft = 0;
        paths.data(datum.percents);

        if (transition) {paths = paths.transition().duration(1000);}

        paths.attr('d', (d, i) => this.makeBarRect(d, i, position));
    }

    makeBarRect(d, i, position) {
        // console.log(d);
        // https://bl.ocks.org/mbostock/3081153
        // create different sized rectangles for each part of the bar, which are paths
        // made up of the number of points in each given state's shape, distributed
        // evenly around the rectangle
    }

    updateSelected() {
        let oldSelected = this._selected;
        let selected = this.model.selectedDatum();
        if (this._selected !== selected.index) {
            this._selected = selected.index;
            return {from: oldSelected, to: this._selected};
        }
        return false;
    }
}
