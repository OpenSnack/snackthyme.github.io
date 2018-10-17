import * as d3 from 'd3';
import {path} from 'd3-path';

import {View} from './View.js';
import {scrollMatchingTween} from '../scrollMatchingTween.js';

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
                calcFunction: () => this.visibleHeight() * 1.3
            }
        ];

        this._state = 'pageload';
        this.screenHeightRatio = 2;
        this.scrollOffset = 1.3;
        this._redThreshold = 5000;
        this._selected = -1;
    }

    init(callback) {
        this.buildDefs();
        this.pathGroups = this.container
          .append('g')
            .attr('transform', 'translate(-1, 0)');

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
            chartHeight: this.visibleHeight() * dims.height
        };
        posParams.centerLeftOffset = (this.container.width() - posParams.chartWidth) / 2;
        posParams.barRight = posParams.centerLeftOffset + posParams.chartWidth;

        this.xScale.rangeRound([0, posParams.chartWidth]);
        this.yScale.range([0, posParams.chartHeight])
            .padding(0.05);

        this.translateMap(posParams, stateChanged);

        if (stateChanged) {
            this.pathGroups
                .transition('map-opacity')
                .duration(this._state === 'off' ? 200 : 500)
                .delay(this._state === 'off' ? 0 : 500)
                .attr('opacity', this._state === 'off' ? 0 : 1);

            this.draw(posParams, stateChanged);
        } else if (trigger === 'resize' || trigger === 'barSelected') {
            this.draw(posParams);
        }
    }

    translateMap(posParams, transition) {
        if (transition) {
            this.pathGroups
                .transition('map-translate')
                .duration(1000)
                .call(scrollMatchingTween, this.topPosition.bind(this));
        } else {
            this.pathGroups.attr('transform', `translate(-1, ${this.topPosition()})`);
        }
    }

    draw(posParams, transition) {
        if (this._state === 'focused') {
            this.drawMap(posParams, transition);
        } else {
            this.drawBar(posParams, transition);
        }
    }

    mapTopPosition() {
        const dims = this.dims[this.orientation()][this._state];
        return this.visibleHeight() * dims.top + window.scrollY - this.container.top();
    }

    topPosition() {
        const dims = this.dims[this.orientation()][this._state];
        if (['off', 'splitbar'].includes(this._state)) {
            return this.barTopPosition(dims);
        }
        return this.mapTopPosition();
    }

    drawBar(position, transition) {
        const view = this;
        const dims = this.dims[this.orientation()][this._state];
        let pathGroups = this.pathGroups.selectAll('g.pathGroup');
        const datum = this.model.currentData()[this._selected];

        let nextLeft = position.centerLeftOffset;

        pathGroups
            .data(datum.percents)
            .each(function(d, i) {
                let paths = d3.select(this).selectAll('path'); // eslint-disable-line
                const width = view.xScale(datum.currentRating) * d;
                const top = view.yScale(datum.ID);
                const coords = view.model.getCoordsByIndex(i);

                paths
                    .attr('class', 'map-bar');

                if (transition) {
                    paths = paths
                        .transition()
                        .delay(Object.values(transition).includes('focused') ? i * 20 : 0)
                        .duration(1000);
                }
                paths
                    .attr('d', (d, i) => view.makeBarRect(nextLeft, top, width, coords, i))
                    .style('opacity', (d, i) => i === 0 ? 0.6 : 0);

                nextLeft += width;
            });
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

        if (numPoints < 6) {
            // D3 can easily handle its map path having more points than the bar rect,
            // but the other way not so much. In any case this is fine
            sidePoints = [1, 1, 1, 0];
        } else {
            sidePoints[0] -= 1; // account for starting moveTo (M) command
            sidePoints[3] -= 1; // account for ending closePath (Z) command
        }

        let pathString = `M${left},${top}`;

        sidePoints.forEach((side, j) => {
            let direction = j < 2 ? 1 : -1;
            let horizStep = width / side;
            let vertStep = this.yScale.bandwidth() / side;

            for (let k = 0; k < side; k++) {
                if (j % 2 === 0) {
                    // horizontal side
                    left += direction * horizStep;
                } else {
                    // vertical side
                    top += direction * vertStep;
                }
                pathString += `L${left},${top}`;
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
            (oldBounds[1][1] - oldBounds[0][1]) / 2
        ]);

        pathGroups
            .data(datum.percents)
            .each(function(d, i) {
                let paths = d3.select(this).selectAll('path'); // eslint-disable-line
                const value = datum.currentRating * d;
                const coords = view.model.getCoordsByIndex(i);
                const features = [];
                for (let j = 0; j < paths.size(); j++) {
                    features.push(view.model.getSingleFeature(i, j));
                }

                paths
                    .data(features)
                    .attr('class', 'map-choro');

                if (transition) {
                    paths = paths
                      .transition()
                      .delay(i * 20)
                      .duration(1000)
                        .attr('d', mapPath)
                        .style('opacity', 0.6);
                }
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

    buildDefs() {
        const defs = this.container.append('defs');
        defs
          .append('filter')
            .attr('id', 'map-erode')
          .append('feMorphology')
            .attr('operator', 'erode')
            .attr('in', 'SourceGraphic')
            .attr('radius', 1);
    }
}
