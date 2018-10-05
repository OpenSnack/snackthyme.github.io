import * as eachCons from 'each-cons';

export class View {
    constructor(model, container, parent) {
        this.model = model;
        this.container = container;
        this.parent = parent;
        this.screenHeightRatio = 1; // feel free to change
    }

    init(callback) {

    }

    update(params) {
        // do something with model data and put results into svg
    }

    setHeight(screenHeight) {
        this.container.attr('height', screenHeight * this.screenHeightRatio);
    }

    visibleHeight() {
        return this.container.height() / this.screenHeightRatio;
    }

    visibleOffset() {
        return this.scrollOffset ? this.visibleHeight() * this.scrollOffset : 0;
    }

    orientation() {
        return window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';
    }

    setCaption(params) {
        this.caption
            .style('width', params.coords.width * window.innerWidth + 'px')
            .style('top', params.coords.top * window.innerHeight + 'px')
            .style('left', params.coords.left * window.innerWidth + 'px')
            .text(params.text);

        if (params.transition) {
            this.caption
              .transition()
              .duration(500)
                .style('opacity', typeof params.opacity !== 'undefined' ? params.opacity : 1);
        } else {
            this.caption
              .transition()
              .duration(1)
                .style('opacity', typeof params.opacity !== 'undefined' ? params.opacity : 1);
        }

    }

    updateState(scrollY) {
        let oldState = this._state;
        let thresholds = this.thresholds
            .slice(1)
            .map((spec) => ({name: spec.name, y: spec.calcFunction()}))
            .sort((a, b) => a[1] > b[1]);

        if (scrollY < thresholds[0].y) {
            this._state = this.thresholds[0].name;
        } else if (thresholds.length === 1) {
            this._state = thresholds[0].name;
        } else if (scrollY > thresholds.slice(-1)[0].y) {
            this._state = thresholds.slice(-1)[0].name;
        } else {
            eachCons(thresholds, 2).some((pair) => {
                if (pair[0].y <= scrollY && scrollY < pair[1].y) {
                    this._state = pair[0].name;
                    return {from: oldState, to: this._state};
                }
            });
        }
        if (oldState !== this._state) {
            return {from: oldState, to: this._state};
        }
        return false;
    }
}
