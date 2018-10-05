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
    }

    init(callback) {
        this.bar = this.container.append('g');

        this.xScale = d3.scaleLinear().domain([0, this._redThreshold * 1.5]).clamp(true);
    }

    update(params) {
        // https://bl.ocks.org/mbostock/3081153
        // create different sized rectangles for each part of the bar, which are paths
        // made up of the number of points in each given state's shape, distributed
        // evenly around the rectangle
    }
}
