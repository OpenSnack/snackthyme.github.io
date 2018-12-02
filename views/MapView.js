import * as d3 from 'd3';
import {path} from 'd3-path';

import {View} from './View.js';
import {scrollMatchingTween} from '../scrollMatchingTween.js';

export class MapView extends View {
    constructor(model, container, parent, params) {
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
                    height: 0.6,
                    top: 0.3
                },
                hover: {
                    width: 0.7,
                    height: 0.6,
                    top: 0.3
                },
                done: {
                    width: 0.7,
                    height: 0.6,
                    top: 0.3
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
                },
                hover: {
                    width: 0.9,
                    height: 0.5,
                    top: 0.4
                },
                done: {
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
                calcFunction: () => this.visibleHeight() * params.splitPoint
            },
            {
                name: 'focused',
                calcFunction: () => this.visibleHeight() * params.focusPoint
            },
            {
                name: 'hover',
                calcFunction: () => this.visibleHeight() * params.hoverPoint
            },
            {
                name: 'done',
                calcFunction: () => this.visibleHeight() * params.donePoint
            },
        ];

        this._captionParams = [
            {
                text: 'What if you could',
                coords: {
                    width: 0.9,
                    top: 0.15,
                    left: 0.05
                }
            },
            {
                text: 'see the big picture?',
                coords: {
                    width: 0.9,
                    top: 0.23,
                    left: 0.05
                }
            },
            {
                text: 'clarify the details?',
                coords: {
                    width: 0.9,
                    top: 0.23,
                    left: 0.05
                }
            }
        ];

        this._labelParams = {
            landscape: {
                text: (value) => `Rating change over time, motivation = ${value}`,
                coords: {
                    width: () => this.dims[this.orientation()]['focused'].width,
                    top: 0.95,
                    left: () => 0.5 - this.dims[this.orientation()]['focused'].width / 2
                }
            },
            portrait: {
                text: (value) => `Rating change over time, motivation = ${value}`,
                coords: {
                    width: () => this.dims[this.orientation()]['focused'].width,
                    top: 0.85,
                    left: () => 0.5 - this.dims[this.orientation()]['focused'].width / 2
                }
            }
        };

        this._state = 'off';
        this.screenHeightRatio = params.donePoint - params.splitPoint + 1;
        this.scrollOffset = params.focusPoint;
        this.splitPoint = params.splitPoint;
        this._redThreshold = 5000;
        this._selected = -1;
        this.highlightID = 'USA-TX';
        this._firstTimeHover = true;
    }

    topPoints() {
        return [
            {
                displayPoint: () => this.visibleOffset() +
                                this.visibleHeight() * (this.dims[this.orientation()]['splitbar'].top),
                onPoint: this.thresholds[1].calcFunction,
                major: false
            },
            {
                displayPoint: () => this.thresholds[2].calcFunction() +
                                this.visibleHeight() * (this.dims[this.orientation()]['focused'].top),
                onPoint: this.thresholds[2].calcFunction,
                major: true
            },
            {
                displayPoint: () => this.thresholds[3].calcFunction() +
                                this.visibleHeight() * (this.dims[this.orientation()]['hover'].top),
                onPoint: this.thresholds[3].calcFunction,
                major: true
            }
        ];
    }

    init(callback) {
        const view = this;
        this.buildDefs(3);
        this.pathGroups = this.container
          .append('g')
            .attr('transform', 'translate(-1, 0)')
            .attr('opacity', 0);

        this.model.json.features.forEach((feature, i) => {
            const group = this.pathGroups
              .append('g')
                .classed('pathGroup', true)
                .on('mouseenter', () => {
                    if (this._state === 'hover') {
                        this.model.setHover(i, d3.mouse(this.container.node()), false);
                    }
                })
                .on('mousemove', () => {
                    if (this._state === 'hover') {
                        this.model.moveHover(d3.mouse(this.container.node()));
                    }
                })
                .on('mouseleave touchend', () => {
                    this.model.endHover();
                });

            this.model.getCoordsByIndex(i).forEach(() => {
                group.append('path');
            });
        });

        this.pathGroups
          .selectAll('g.pathGroup')
            .each(function(d, i) {
                let paths = d3.select(this).selectAll('path'); // eslint-disable-line
                const coords = view.model.getCoordsByIndex(i);
                const features = [];
                for (let j = 0; j < paths.size(); j++) {
                    features.push(view.model.getSingleFeature(i, j));
                }

                paths.data(features);
            });

        /* eslint-disable */
        this.container
            .on('touchstart touchmove', function() {
                const path = d3.select(document.elementFromPoint(...d3.touches(this)[0]));
                if (!path.node() || path.node().tagName === 'svg') {
                    view.model.endHover();
                } else if (view._state === 'hover') {
                    d3.event.preventDefault(); // prevent scrolling
                    if (path.datum().id === view.highlightID) {
                        view.unsetHighlight(view.highlightID, true);
                    }
                    const hoverI = view.model.getFeatureIndexById(path.datum().id);
                    view.model.setHover(hoverI, d3.touches(this)[0], true);
                }
            })
            .on('touchend', () => {
                this.model.endHover();
            });
        /* eslint-enable */

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold * 1.5]).clamp(true);
        this.yScale = d3.scaleBand().domain(this.model.data.map((rowDict) => rowDict.ID));

        this.captionTop = this.parent.container
          .append('span')
            .classed('caption', true);
        this.caption1 = this.parent.container
          .append('span')
            .classed('caption', true);
        this.caption2 = this.parent.container
          .append('span')
            .classed('caption', true);

        this.label = this.parent.container
          .append('span')
            .classed('label', true);
    }

    update(params) {
        const {trigger} = params;
        const stateChanged = this.updateState(window.scrollY); // do things that need to know the state AFTER this
        const selectedChanged = this.updateSelected();

        const dims = this.dims[this.orientation()][this._state];

        const posParams = {
            chartWidth: this.container.width() * dims.width,
            chartHeight: this.visibleHeight() * dims.height,
            trigger: trigger
        };
        posParams.centerLeftOffset = (this.container.width() - posParams.chartWidth) / 2;
        posParams.barRight = posParams.centerLeftOffset + posParams.chartWidth;

        this.xScale.rangeRound([0, posParams.chartWidth]);
        this.yScale.range([0, posParams.chartHeight]).padding(0.05);

        this.translateMap(posParams, stateChanged);
        this.setCaptions(stateChanged);

        let labelOpacity = ['focused', 'hover'].includes(this._state) ? 0.8 : 0;
        let labelTransition = this.doLabelTransition(stateChanged);
        this.setCaption(
            Object.assign(
                {}, this._labelParams[this.orientation()],
                {
                    opacity: labelOpacity,
                    transition: labelTransition,
                    textValue: this.signedLabelValue(this.model.sliderValue())
                }
            ),
            this.label
        );

        let states = stateChanged ? Object.values(stateChanged) : [];

        if (stateChanged) {
            this.pathGroups
                .transition('map-opacity')
                .duration(this._state === 'off' ? 200 : 500)
                .delay(this._state === 'off' ? 0 : 500)
                .attr('opacity', this._state === 'off' ? 0 : 1);

            if (!(states.includes('hover') || states.includes('done'))) {
                this.draw(posParams, stateChanged);
            } else {
                this.draw(posParams);
            }

            if (stateChanged.to === 'hover') {
                if (this._firstTimeHover) {
                    this.setHighlight(this.highlightID, 10);
                }
            } else {
                this.unsetHighlight(this.highlightID);
            }
        } else if (trigger === 'resize' || trigger === 'barSelected') {
            this.draw(posParams);
        }
    }

    signedLabelValue(value) {
        const sign = Math.sign(value) > 0 ? '+' : '';
        return `${sign}${value * 100}`;
    }

    getPathInfo(id) {
        const highlightPaths = this.pathGroups.selectAll('path');
        if (typeof highlightPaths.data()[0] === 'undefined') {return {};}

        const highlightPath = highlightPaths
          .filter((d) => d.id === id);

        const datum = this.model.currentData()[this._selected];
        const datumScale = d3.scaleLinear()
            .domain([0, Math.max(...datum.percents)])
            .range([0.3, 1]);
        let pathDatum = d3.select(highlightPath.node().parentNode).datum();

        return {
            path: highlightPath,
            scale: datumScale,
            datum: pathDatum
        };
    }

    setHighlight(id, radius) {
        const {path, scale, datum} = this.getPathInfo(id);

        /* eslint-disable */
        path
          .transition()
            .duration(500)
            .on('start', function pulse() {
                d3.active(this)
                    .style('fill', 'rgb(245, 113, 67)') // orange
                    .style('opacity', '1')
                  .transition()
                    .duration(500)
                    .style('fill', 'rgb(100,200,255)') // original blue
                    .style('opacity', scale(datum))
                  .transition()
                    .duration(500)
                    .on('start', function() {
                        if (Object.keys(this.__transition).length < 2) pulse.apply(this);
                    });
            });
        /* eslint-enable */

        path
            .on('mouseenter touchstart', () => {this.unsetHighlight(id, true);});
    }

    unsetHighlight(id, interacted) {
        if (interacted) {
            this._firstTimeHover = false;
        }

        const {path, scale, datum} = this.getPathInfo(id);
        if (typeof datum !== 'undefined') {
            path
              .transition('highlight')
                .duration(500)
                .style('fill', 'rgb(100,200,255)') // original blue
                .style('opacity', scale(datum))
                .on('end', () => {
                    path.classed('hover-hint', false);
                });
        }
    }

    doLabelTransition(changed) {
        if (!changed) {return false;}
        let states = Object.values(changed);
        return states.includes('focused') || states.includes('hover');
    }

    isMapState() {
        return ['focused', 'hover', 'done'].includes(this._state);
    }

    isFixedState(stateChanged) {
        if (!stateChanged) {
            return ['focused', 'hover', 'done'].includes(this._state);
        }
        let states = Object.values(stateChanged);
        return !(states.includes('hover') || states.includes('done'));
    }

    translateMap(posParams, stateChanged) {
        if (!stateChanged || stateChanged.to === 'hover' || stateChanged.to === 'done') {
            if (!d3.active(this.pathGroups.node(), 'map-translate')) {
                this.pathGroups.attr('transform', `translate(-1, ${this.topPosition(stateChanged)})`);
            }
            if (stateChanged.to === 'hover') {
                this.container.style('position', 'fixed');
            }
            if (stateChanged.to === 'done') {
                if (d3.active(this.pathGroups.node(), 'map-translate')) {
                    this.pathGroups.interrupt('map-translate');
                }
                this.container.style('position', null);
            }
        } else {
            const transition = this.pathGroups
                .transition('map-translate')
                .duration(1000)
                .call(scrollMatchingTween, () => this.topPosition(stateChanged));

            if (stateChanged.from === 'splitbar' && stateChanged.to === 'focused') {
                transition.on('end', () => {
                    this.container.style('position', 'fixed');
                    this.pathGroups.attr('transform', `translate(-1, ${this.topPosition(stateChanged)})`);
                });
            } else if (stateChanged.from === 'focused' && stateChanged.to === 'splitbar') {
                transition.on('start', () => {
                    const dims = this.dims[this.orientation()]['focused'];
                    const fixedTop = this.visibleHeight() * dims.top;
                    this.pathGroups
                        .attr('transform', `translate(-1, ${fixedTop + window.scrollY - this.container.top()})`);
                    this.container.style('position', null);
                });
            }
        }
    }

    draw(posParams, transition) {
        if (this.isMapState()) {
            this.container.style('z-index', 998);
            this.drawMap(posParams, transition);
        } else {
            this.container.style('z-index', null);
            this.drawBar(posParams, transition);
        }
    }

    mapTopPosition(changed) {
        const dims = this.dims[this.orientation()][this._state];
        const fixedTop = this.visibleHeight() * dims.top;

        if (changed && changed.from === 'splitbar' && changed.to === 'focused') {
            return fixedTop + window.scrollY - this.container.top();
        }
        if (this._state === 'done') {
            return fixedTop + this.thresholds[4].calcFunction() - this.visibleOffset();
        }
        return fixedTop;
    }

    topPosition(changed) {
        const dims = this.dims[this.orientation()][this._state];
        if (['off', 'splitbar'].includes(this._state)) {
            return this.barTopPosition(dims);
        }
        return this.mapTopPosition(changed);
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

                paths.attr('class', 'map-bar');

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
            return fixedTop - (this.visibleHeight() * this.splitPoint - window.scrollY);
        }
        return fixedTop;
    }

    setProjection(posParams) {
        const testProjection = d3.geoAlbers();
        let mapPath = d3.geoPath().projection(testProjection);
        const oldBounds = mapPath.bounds(this.model.json);

        const projection = d3.geoAlbers();

        // scale map to fit width defined in this.dims
        let newScale = testProjection.scale() * posParams.chartWidth / (oldBounds[1][0] - oldBounds[0][0]);
        testProjection.scale(newScale);
        const newBounds = mapPath.bounds(this.model.json);

        if (newBounds[1][1] - newBounds[0][1] > posParams.chartHeight) {
            newScale = projection.scale() * posParams.chartHeight / (oldBounds[1][1] - oldBounds[0][1]);
            projection.scale(newScale);
        } else {
            projection.scale(newScale);
        }

        const outPath = mapPath.projection(projection);
        const outBounds = mapPath.bounds(this.model.json);

        projection.translate([
            this.container.width() / 2,
            (outBounds[1][1] - outBounds[0][1]) / 2
        ]);

        return outPath;
    }

    drawMap(posParams, transition) {
        const view = this;
        let pathGroups = this.pathGroups.selectAll('g.pathGroup');
        const mapPath = this.setProjection(posParams);

        const datum = this.model.currentData()[this._selected];
        const datumScale = d3.scaleLinear()
            .domain([0, Math.max(...datum.percents)])
            .range([0.3, 1]);

        pathGroups
            .data(datum.percents)
            .each(function(d, i) {
                let paths = d3.select(this).selectAll('path'); // eslint-disable-line
                const coords = view.model.getCoordsByIndex(i);

                paths.attr('class', 'map-choro');

                if (transition) {
                    paths = paths
                      .transition('bar-to-map')
                      .delay(i * 20)
                      .duration(1000)
                        .attr('d', mapPath)
                        .style('opacity', datumScale(d));
                } else {
                    if (posParams.trigger === 'resize') {
                        paths.interrupt('bar-to-map');
                    }
                    paths
                        .attr('d', mapPath)
                        .style('opacity', datumScale(d));
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

    buildDefs(glowStrength) {
        const defs = this.container.append('defs');
        const sizes = [['map-erode', 1], ['map-erode-more', 2], ['map-erode-most', 4]];

        sizes.forEach(([id, radius]) => {
            defs
              .append('filter')
                .attr('id', id)
              .append('feMorphology')
                .attr('operator', 'erode')
                .attr('in', 'SourceGraphic')
                .attr('radius', radius);
        });
    }

    setCaptions(changed) {
        let capOpacities = this.captionOpacities(window.scrollY);
        [this.captionTop, this.caption1, this.caption2].forEach((caption, i) => {
            this.setCaption(
                Object.assign(
                    {}, this._captionParams[i],
                    {
                        opacity: capOpacities[i],
                        transition: changed,
                        immediate: Object.values(changed).includes('done')
                    }
                ),
                caption
            );
        });
    }

    captionOpacities(scrollY) {
        if (['off', 'splitbar'].includes(this._state)) {
            return [0, 0, 0];
        } else if (this._state === 'focused') {
            return [1, 1, 0];
        } else if (this._state === 'hover') {
            return [1, 0, 1];
        }

        let fadeStartPoint = this.thresholds[4].calcFunction(); // done
        let offset = this.visibleHeight() * this._captionParams[0].coords.top;
        let scrollFadeDiff = fadeStartPoint + offset - scrollY;
        if (scrollFadeDiff < 0) return [0, 0, 0];

        let fadingOpacity = scrollFadeDiff / offset;
        return [fadingOpacity, 0, fadingOpacity];
    }
}
