"use strict";

import Guid from "./utils/guid.js";
import Payment from "./model/payment.js";
import Template from "./model/template.js";

const internal = Symbol("internal");

const paymentProxy = {
    set (target, property, value) {
        Reflect.set(target, property, value);
    }
};

const templateProxy = {
    set (target, property, value) {
        Reflect.set(target, property, value);
    }
};

export default class MoneyStorage {
    /**
     *
     *
     * @param {String} [storage]
     */
    constructor(storage) {
        this[internal] = {
            payments: [],
            templates: [],
            locale: "en-GB",
            currency: "EUR",
            date: new Date()
        };

        if (storage === undefined) {
            return;
        }

        if (typeof storage === "string") {
            if (storage.length === 0) {
                return;
            }

            storage = JSON.parse(storage);
        }

        if (typeof(storage.date) === "string") {
            try {
                storage.date = new Date(storage.date);
            } catch { }
        }

        if (storage.date instanceof Date) {
            this[internal].date = storage.date;
        }

        if (storage.payments !== undefined && Array.isArray(storage.payments)) {
            storage.payments.forEach(p => this[internal].payments.push(new Proxy(new Payment(p), paymentProxy)));
        }

        if (storage.templates !== undefined && Array.isArray(storage.templates)) {
            storage.templates.forEach(t => this[internal].templates.push(new Proxy(new Template(t), templateProxy)));
        }

        if (typeof(storage.locale) === "string" && storage.locale.length > 0) {
            this[internal].locale = storage.locale;
        }

        if (typeof(storage.currency) === "string" && storage.currency.length === 3) {
            this[internal].currency = storage.currency;
        }
    }

    get date() {
        return this[internal].date;
    }

    set date(value) {
        if (value instanceof Date) {
            this[internal].date = value;
        } else {
            throw new TypeError("value must be a Date");
        }
    }

    get locale() {
        return this[internal].locale;
    }

    set locale(value) {
        if (typeof value === "string" && value.length > 0) {
            this[internal].locale = value;
        } else {
            throw new TypeError("value must be a non-empty string");
        }
    }

    get currency() {
        return this[internal].currency;
    }

    set currency(value) {
        if (typeof value === "string" && value.length === 3) {
            this[internal].currency = value;
        } else {
            throw new TypeError("value must be a three-character string");
        }
    }

    /**
     * @returns {Payment[]}
     */
    get payments() {
        return this[internal].payments;
    }

    /**
     * Get all payments for the current month.
     *
     * @param {Date} month
     * @returns {Payment[]}
     * @throws {TypeError} if month is not a Date.
     */
    getPaymentsByMonth(month) {
        if (month instanceof Date) {
            return this[internal].payments.filter(p => p.date.getFullYear() === month.getFullYear() && p.date.getMonth() === month.getMonth());
        } else {
            throw new TypeError("month is not a valid date.");
        }
    }

    /**
     * Get payment with specified ID.
     *
     * @param {Guid} id
     * @returns {?Payment}
     */
    getPayment(id) {
        return this[internal].payment.find(p => p.id === id);
    }

    /**
     * Stored changed payment in the dataset, adding if it doesn't already exist.
     *
     * @param {Payment} payment
     */
    updatePayment(payment) {
        if (payment instanceof Payment){
            for (let p = 0; p < this[internal].payments.length; p++) {
                if (payment.id === this[internal].payments[p].id) {
                    this[internal].payment[p] = payment;
                    return;
                }
            }

            this[internal].payments.push(payment);
        } else {
            throw new TypeError("payment is not the correct type.");
        }
    }

    /**
     * Removes payment from the dataset if it exists.
     *
     * @param {(Payment|Guid)} payment
     */
    removePayment(payment) {
        if (payment instanceof Payment) {
            payment = payment.id;
        }

        if (payment instanceof Guid) {
            for (let p = 0; p < this[internal].payments.length; p++) {
                if (payment === this[internal].payments[p].id) {
                    this[internal].payments.splice(p, 1);
                    return;
                }
            }
        } else {
            throw new TypeError("payment must be a Payment or Guid.");
        }
    }

    /**
     * @returns {Template[]}
     */
    get templates() {
        return this[internal].templates;
    }

    /**
     * Get all templates for the current month.
     *
     * @param {Date} month
     * @returns {Template[]}
     * @throws {TypeError} if month is not a Date.
     */
    getTemplatesByMonth(month) {
        if (month instanceof Date) {
            return this[internal].templates.filter(t => t.isDueInMonth(month));
        } else {
            throw new TypeError("month is not a valid date.");
        }
    }

    /**
     * Get template with specified ID.
     *
     * @param {Guid} id
     * @returns {?Template}
     */
    getTemplate(id) {
        return this[internal].templates.find(t => t.id === id);
    }

    /**
     * Stored changed template in the dataset, adding if it doesn't already exist.
     *
     * @param {Template} template
     */
    updateTemplate(template) {
        if (template instanceof Template){
            for (let t = 0; t < this[internal].templates.length; t++) {
                if (template.id === this[internal].templates[t].id) {
                    this[internal].templates[t] = template;
                    return;
                }
            }

            this[internal].templates.push(template);
        } else {
            throw new TypeError("template is not the correct type.");
        }
    }


    /**
     * Removes template from the dataset if it exists.
     *
     * @param {(Template|Guid)} template
     */
    removeTemplate(template) {
        if (template instanceof Template) {
            template = template.id;
        }

        if (template instanceof Guid) {
            for (let t = 0; t < this[internal].templates.length; t++) {
                if (template === this[internal].templates[t].id) {
                    this[internal].templates.splice(t, 1);
                    return;
                }
            }
        } else {
            throw new TypeError("template must be a Template or Guid.");
        }
    }

    toJSON() {
        return {
            date: this.date,
            payments: this.payments,
            templates: this.templates,
            locale: this.locale,
            currency: this.currency
        }
    }
}