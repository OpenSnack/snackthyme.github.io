export class Model {
    constructor() {
        this._observers = [];
    }

    addObserver(view) {
        this._observers.push(view);
    }

    notify() {
        this._observers.forEach((view) => {view.update();});
    }
}
