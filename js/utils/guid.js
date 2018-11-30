"use strict";

const internal = Symbol("internal");
const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let generate = () => { "" };

if (crypto !== undefined && typeof crypto.getRandomValues === 'function') {
    generate = () => {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    }
} else if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
    generate = () => {
        var d = new Date().getTime() + performance.now();

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
} else {
    generate = () => {
        var d = new Date().getTime();

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}

class Guid {
    static get empty() {
        return new Guid("00000000-0000-0000-0000-000000000000");
    }

    /**
     * @return {string}
     */
    get value() {
        return this[internal];
    }

    /**
     * @param {?(Guid|string)} value
     */
    constructor(value) {
        if (value === undefined) {
            this[internal] = generate();
        } else if (value instanceof Guid) {
            this[internal] = value.value;
        } else if (regex.test(value)) {
            this[internal] = value;
        } else {
            RangeError("value did not convert to a valid guid");
        }
    }

    /**
     * @returns {string}
     */
    toString() {
        return this.value;
    }

    /**
     * @returns {string}
     */
    toJSON() {
        return this.value;
    }

    /**
     * @returns {string}
     */
    valueOf() {
        return this.value;
    }

    /**
     *
     * @param {Guid} other
     * @returns {boolean}
     */
    equalTo(other) {
        return other !== null && other instanceof Guid && other.valueOf() === this.value;
    }
}

export { Guid };