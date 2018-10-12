import * as d3 from 'd3';

import {View} from './View.js';
import {path} from 'd3-path';

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
                    top: 0.8
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
                    top: 0.8
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
                calcFunction: () => this.visibleHeight() * 1.3
            }
        ];

        this.screenHeightRatio = 2;
        this.scrollOffset = 1.3;
        this._redThreshold = 5000;
        this._selected = -1;
    }

    init(callback) {
        this.pathGroups = this.container.append('g');
        this.model.json.features.forEach((feature, i) => {
            const group = this.pathGroups
              .append('g')
                .classed('pathGroup', true);

            this.model.getCoordsByIndex(i).forEach(() => {
                group.append('path');
            });
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
            chartTop: this.barTopPosition(dims),
            mapTop: this.visibleHeight() * dims.top
        };
        posParams.centerLeftOffset = (this.container.width() - posParams.chartWidth) / 2;
        posParams.barRight = posParams.centerLeftOffset + posParams.chartWidth;

        this.xScale.rangeRound([0, posParams.chartWidth]);
        this.yScale.range([0, posParams.chartHeight])
            .padding(0.05);

        if (stateChanged) {
            this.pathGroups
                .transition()
                .duration(this._state === 'off' ? 200 : 500)
                .delay(this._state === 'off' ? 0 : 500)
                .attr('opacity', this._state === 'off' ? 0 : 1);

            let states = Object.values(stateChanged);
            if (states.includes('focused') && states.includes('splitbar')) {
                this.draw(posParams, true);
            } else {
                this.draw(posParams);
            }
        } else {
            this.draw(posParams);
        }
    }

    draw(posParams, transition) {
        if (this._state === 'focused') {
            this.drawMap(posParams, transition);
        } else {
            this.drawBar(posParams, transition);
        }
    }

    drawBar(position, transition) {
        const view = this;
        let pathGroups = this.pathGroups.selectAll('g.pathGroup');
        const datum = this.model.currentData()[this._selected];

        let nextLeft = position.centerLeftOffset;

        pathGroups
            .data(datum.percents)
            .each(function(d, i) {
                const paths = d3.select(this).selectAll('path'); // eslint-disable-line
                const width = view.xScale(datum.currentRating) * d;
                const top = view.yScale(datum.ID) + position.chartTop;
                const coords = view.model.getCoordsByIndex(i);

                paths.attr('d', (d, i) => view.makeBarRect(nextLeft, top, width, coords, i));
                nextLeft += width;
            });

        // if (transition) {paths = paths.transition().duration(1000);}
    }

    makeBarRect(left, top, width, coords, i) {
        // https://bl.ocks.org/mbostock/3081153
        // create different sized rectangles for each part of the bar, which are paths
        // made up of the number of points in each given state's shape, distributed
        // evenly around the rectangle
        let numPoints = coords[i].length;
        // this fills an array into quarters of numPoints, then distributes the
        // remaining 0-3 points into the array as evenly as possible
        // e.g. 13 points => [4, 3, 3, 3]
        let sidePoints = Array(4)
            .fill(Math.floor(numPoints / 4))
            .map((s, i) => numPoints % 4 >= i+1 ? s + 1 : s);

        let pathString = `M${left} ${top} `;

        sidePoints.forEach((side, j) => {
            let ori = j % 2 === 0 ? 'h' : 'v';
            let direction = j < 2 ? 1 : -1;
            let step = 0;
            if (ori === 'h') {
                step = width / (side + 1);
            } else {
                step = this.yScale.bandwidth() / (side + 1);
            }

            for (let k = 0; k <= side; k++) {
                pathString += `${ori} ${step * direction} `;
            }
        });
        return pathString + 'Z';
    }

    barTopPosition(dims) {
        let fixedTop = this.visibleHeight() * dims.top;
        if (this._state === 'off') {
            return fixedTop - (this.visibleHeight() - window.scrollY);
        }
        return fixedTop;
    }

    drawMap(posParams, transition) {
        const view = this;
        let pathGroups = this.pathGroups.selectAll('g.pathGroup');
        const datum = this.model.currentData()[this._selected];

        const projection = d3.geoAlbers();
        let mapPath = d3.geoPath().projection(projection);
        const oldBounds = mapPath.bounds(this.model.json);
        // scale map to fit width defined in this.dims
        const newScale = projection.scale() * posParams.chartWidth / (oldBounds[1][0] - oldBounds[0][0]);
        projection.scale(newScale);
        projection.translate([
            this.container.width() / 2,
            posParams.mapTop + (oldBounds[1][1] - oldBounds[0][1]) / 2
        ]);

        pathGroups
            .data(datum.percents)
            .each(function(d, i) {
                const paths = d3.select(this).selectAll('path'); // eslint-disable-line
                const value = datum.currentRating * d;
                const coords = view.model.getCoordsByIndex(i);
                const features = [];
                for (let j = 0; j < paths.size(); j++) {
                    features.push(view.model.getSingleFeature(i, j));
                }

                paths
                    .data(features)
                    .attr('d', mapPath);
            });
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
