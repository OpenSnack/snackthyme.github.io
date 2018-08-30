export class Model {
    constructor() {
        this._observers = [];
        this._numViews = 0;
        this.data = [];
        this.viewIndex = 0;
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
