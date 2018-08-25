export class View {
    constructor(model, svg) {
        this.model = model;
        this.svg = svg;
    }

    enter(fromLocation, nextData, callback) {
        // user scrolled and this view is coming in from off screen
        // fromLocation is 'top' or 'bottom'
    }

    update() {
        // do something with model data and put results into svg
    }

    exit(toLocation, nextData, callback) {
        // user scrolled and this view is leaving the screen for some other view
        // toLocation is 'top' or 'bottom'
    }
}
