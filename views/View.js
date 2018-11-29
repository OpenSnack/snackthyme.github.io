import * as eachCons from 'each-cons';

import {Observer} from '../Observer.js';

export class View extends Observer {
    constructor(model, container, parent) {
        super(model);
        this.container = container;
        this.parent = parent;
        this.screenHeightRatio = 1; // feel free to change
    }

    init(callback) {

    }

    ready() {

    }

    update(params) {
        // do something with model data and put results into svg
    }

    topPoints() {

    }

    setHeight(screenHeight) {
        this.container.style('height', `${screenHeight * this.screenHeightRatio}px`);
    }

    visibleHeight() {
        return this.container.height() / this.screenHeightRatio;
    }

    visibleOffset() {
        return this.scrollOffset ? this.visibleHeight() * this.scrollOffset : 0;
    }

    orientation() {
        return document.body.clientWidth >= document.body.clientHeight ? 'landscape' : 'portrait';
    }

    setCaption(params, target) {
        target = target || this.caption;

        target
            .style('width', params.coords.width * document.body.clientWidth + 'px')
            .style('top', params.coords.top * document.body.clientHeight + 'px')
            .style('left', params.coords.left * document.body.clientWidth + 'px')
            .html(params.text);

        if (params.transition && !params.immediate) {
            target
              .transition('caption-opacity')
              .duration(500)
                .style('opacity', typeof params.opacity !== 'undefined' ? params.opacity : 1);
        } else {
            if (params.immediate && d3.active(target.node(), 'caption-opacity')) {
                target.interrupt('caption-opacity');
            }
            target.style('opacity', typeof params.opacity !== 'undefined' ? params.opacity : 1);
        }

    }

    updateState(scrollY) {
        let oldState = this._state;
        let thresholds = this.thresholds
            .slice(1)
            .map((spec) => ({name: spec.name, y: spec.calcFunction()}))
            .sort((a, b) => a.y > b.y);

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
