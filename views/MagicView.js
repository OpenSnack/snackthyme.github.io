import * as d3 from 'd3';

export class MagicView {
    constructor(model, views, container) {
        this.model = model;
        this.container = container;
        this.viewOrder = views;
    }

    init() {
        this.model.addObserver(this);
    }

    update() {
        // scroll in the next requested view according to the model
    }

    enter() {}
    exit() {}
}
