"use strict";

import Guid from "../utils/guid.js";
import Template from "./template.js";

const internal = Symbol("internal");

export default class Payment {
    /**
     * Create a new Payment based on provided parameters.
     *
     * @param {(Template|String|Object} values
     * @param {?Date} date
     * @param {?Number} amount
     * @param {?boolean} closePartial
     */
    constructor(values, date = null, amount = 0, closePartial = false) {
        this[internal] = {
            id: new Guid(),
            templateId: null,
            name: "",
            amount: 0,
            date: null,
            closePartial: false,
            created: Date.now()
        };

        if (values === undefined)
            return;

        if (typeof values === "string") {
            if (values.length === 0) {
                throw new RangeError("name cannot be empty.");
            }

            if (isNaN(amount) || amount === 0) {
                throw new RangeError("amount must be a none-zero number");
            }

            if (!(date instanceof Date)) {
                throw new RangeError("date must be none-null Date");
            }

            this[internal].templateId = Guid.empty;
            this[internal].name = values;
            this[internal].amount = amount;
            this[internal].date = date;
        } else if (values instanceof Template) {
            if (isNaN(amount)) {
                throw new RangeError("amount must be a number");
            }

            if ((amount < 0 && values.amount > 0) || (amount > 0 && values.amount < 0)) {
                throw new RangeError("invalid amount specified for given template type");
            }

            if (!(date instanceof Date)) {
                throw new RangeError("date must be none-null Date");
            }

            this[internal].templateId = values.id;
            this[internal].name = values.name;
            this[internal].amount = amount;
            this[internal].date = date;

            if (values.partial) {
                this[internal].closePartial = closePartial;
            }
        } else {
            this[internal].id = values.id;
            this[internal].templateId = values.templateId;
            this[internal].name = values.name;
            this[internal].amount = values.amount;
            this[internal].date = values.date;
            this[internal].closePartial = values.closePartial;
        }
    }

    /**
     * @returns {!Guid}
     */
    get id() {
        return this[internal].id;
    }

    /**
     * @returns {!Guid}
     */
    get templateId() {
        return this[internal].templateId;
    }

    set templateId(value) {
        if (this[internal].templateId !== null) {
            throw new Error("Cannot reassign payment");
        }

        if (typeof value === "string") {
            value = new Guid(value);
        }

        if (value instanceof Template) {
            value = value.id;
        }

        if (value instanceof Guid) {
            this[internal].templateId = value;
            return;
        }

        throw new TypeError("templateId is invalid");
    }

    /**
     * @returns {String}
     */
    get name() {
        return this[internal].name;
    }

    set name(value) {
        if (this[internal].templateId !== null && this[internal].templateId !== Guid.empty) {
            throw new Error("Cannot rename scheduled payments.");
        }

        if (typeof value !== "string" || value.length === 0) {
            throw new RangeError("name must be a none-empty string.");
        }

        this[internal].name = value;
    }

    /**
     * @returns {Number}
     */
    get amount() {
        return this[internal].amount;
    }

    set amount(value) {
        if (isNaN(value) || value === 0) {
            throw new RangeError("amount must be a none-zero number");
        }

        this[internal].amount = value;
    }

    /**
     * @returns {boolean}
     */
    get closePartial() {
        return this[internal].closePartial;
    }

    set closePartial(value) {
        if (this[internal].templateId !== null && this[internal].templateId !== Guid.empty) {
            throw new Error("Cannot close custom scheduled payments.");
        }

        this[internal].closePartial = value;
    }

    /**
     * @returns {Date}
     */
    get created() {
        return this[internal].created;
    }

    toJSON() {
        return {
            id: this.id,
            templateId: this.templateId,
            name: this.name,
            amount: this.amount,
            date: this.date,
            closePartial: this.closePartial,
            created: this.created
        }
    }
}