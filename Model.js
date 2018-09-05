import {csv} from 'd3';

export class Model {
    constructor() {
        this._observers = [];
        this.data = null;
        this._numViews = 0;
        this.viewIndex = 0;
    }

    load(filename, callback) {
        csv(filename, csv.csvParseRows).then((data) => {
            this.data = data;
            callback(this);
        });
    }

    addObserver(view) {
        this._observers.push(view);
    }

    notify(params) {
        this._observers.forEach((view) => {view.update(params);});
    }

    setNumViews(num) {
        this._numViews = num;
    }
}
