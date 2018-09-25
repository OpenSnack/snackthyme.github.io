import * as eachCons from 'each-cons';

export class View {
    constructor(model, svg, parent) {
        this.model = model;
        this.svg = svg;
        this.parent = parent;
    }

    init(callback) {

    }

    update(scrollY) {
        // do something with model data and put results into svg
    }

    setHeight(screenHeight) {
        this.svg.attr('height', screenHeight * this.screenHeightRatio);
    }

    visibleHeight() {
        return this.svg.height() / this.screenHeightRatio;
    }

    orientation() {
        return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
    }

    setCaption(params) {
        this.caption
            .style('width', params.coords.width * window.innerWidth + 'px')
            .style('top', params.coords.top * window.innerHeight + 'px')
            .style('left', params.coords.left * window.innerWidth + 'px')
            .style('opacity', typeof params.opacity !== 'undefined' ? params.opacity : 1)
            .text(params.text);
    }

    updateState(scrollY) {
        let oldState = this._state;
        let thresholds = this.thresholds
            .slice(1)
            .map((spec) => ({name: spec.name, y: spec.calcFunction()}))
            .sort((a, b) => a[1] > b[1]);

        if (scrollY < thresholds[0].y) {
            this._state = this.thresholds[0].name;
        } else if (scrollY > thresholds[1].y) {
            this._state = thresholds[1].name;
        } else {
            eachCons(thresholds, 2).some((pair) => {
                if (pair[0].y <= scrollY && scrollY < pair[1].y) {
                    this._state = pair[0].name;
                    return true;
                }
            });
        }
        return oldState !== this._state;
    }
}
