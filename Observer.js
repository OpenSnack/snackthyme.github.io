export class Observer {
    constructor(model) {
        this.model = model;
        this._tags = [];
    }

    tag(tags) {
        if (typeof tags === 'string') {
            this._tags = [tags];
        } else {
            this._tags = tags;
        }

        return this;
    }

    matches(tags) {
        if (typeof tags === 'string') {
            tags = [tags];
        }
        // array intersection
        return tags.filter((tag) => -1 !== this._tags.indexOf(tag)).length > 0;
    }
}
