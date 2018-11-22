"use strict";

if (localStorage === undefined)
    throw new Error("Local Storage is not supported.");

import Guid from "./utils/guid.js";
import Template from "./model/template.js";
import Payment from "./model/payment.js";
import MoneyStorage from "./storage.js";
import Strings from "./strings.js";

const exportable = crypto !== undefined && crypto.subtle !== undefined;
const internal = Symbol("internal");
const save = Symbol("save");

export default class PaymentEngine {

    /**
     * Bind a payment engine to the current window.
     */
    constructor() {
        this[internal] = {
            /**
             * @type {MoneyStorage}
             */
            storage: {},
            month: new Date(),
            expected: 0,
            paid: 0,
            remaining: 0,
            /**
             * @type {function[]}
             */
            onchange: [],
            trigger: event => {
                switch (event) {
                    case 'change':
                        this[internal].onchange.forEach(h => h({ caller: this }));
                        return;
                }
            }
        };

        this[save] = () => {
            localStorage.eyePaymentEngine = JSON.stringify(this[internal].storage);
            this[internal].trigger('change');
        }

        this[internal].storage = new MoneyStorage(localStorage.eyePaymentEngine);

        window.addEventListener("storage", e => {
            if (e.key === "eyePaymentEngine") {
                this[internal].storage = new MoneyStorage(e.newValue);
                this[internal].trigger('change');
            }
        });
    }

    /**
     * Selected month.
     *
     * @returns {Date}
     */
    get month() {
        return this[internal].month;
    }

    set month(value) {
        if (typeof value === Date) {
            if (value != this[internal].month) {
                this[internal].month = value;


                this[internal].expected = 0;
                this[internal].paid = 0;
                this[internal].remaining = 0;

                let payments = this.payments;
                this.templates.forEach(template => {
                    if (template.amount > 0) {
                        this[internal].expected += template.amount;
                        if (template.partial) {
                            let paid = false;
                            let total = 0;

                            payments.filter(p => p.templateId === template.id).forEach(payment => {
                                total += payment.amount;
                                paid |= payment.closePartial;
                            });

                            if (!paid) {
                                this[internal].remaining += Math.max(0, template.amount - total);
                            }
                        } else if (payments.find(p => p.templateId === template.id) === undefined) {
                            this[internal].remaining += template.amount;
                        }
                    }
                });

                payments.forEach(payment => {
                    this[internal].paid += payment.amount;
                });

                this[save]();
            }
        } else {
            throw new TypeError("value must be a date.");
        }
    }

    get expected() {
        return this[internal].expected;
    }

    get paid() {
        return this[internal].paid;
    }

    get remaining() {
        return this[internal].remaining;
    }

    /**
     * Get payments for currently selected month.
     *
     * @prop {Payment[]}
     */
    get payments() {
        return this[internal].storage.getPaymentsByMonth(this.month);
    }

    /**
     * Get templates for currently selected month.
     *
     * @prop {Template[]}
     */
    get templates() {
        return this[internal].storage.getTemplatesByMonth(this.month);
    }

    /**
     * Attempts to pay the provided template in the current month.
     *
     * @param {(Guid|string)} id Template ID
     * @param {Number} amount
     * @param {boolean} [final=false]
     */
    addPayment(id, amount, final = false) {
        if (typeof id === "string")
            id = new Guid(id);

        var template = this.templates.find(t => t.id === id);
        if (template === undefined) {
            throw new RangeError("template does not exist in the current month");
        }

        var payments = this.payments.filter(p => p.templateId === id);
        if ((template.partial && payments.find(p => p.closePartial)) || payments.length > 0) {
            throw new RangeError("This template has already been paid");
        }

        var payment = new Payment(template, this.month, amount);
        if (template.partial && final) {
            payment.closePartial = true;
        }

        this[internal].storage.updatePayment(payment);
        this[save]();
    }

    /**
     * Add a new payment unrelated to any schedule.
     *
     * @param {String} name
     * @param {Number} amount
     * @param {Date} date
     */
    addUnexpected(name, amount) {
        var payment = new Payment(name, this.month, amount);

        this[internal].storage.updatePayment(payment);
        this[save]();
    }

    /**
     * Undo a payment in the current month.
     *
     * @param {(Guid | String | Payment)} id
     */
    undoPayment(id) {
        if (typeof id === "string") {
            id = new Guid(id);
        }

        if (id instanceof Payment) {
            id = id.id
        }

        var payment = this.payments.find(p => p.id === id);
        if (payment === undefined) {
            throw new Error("payment not found");
        }

        this[internal].storage.removePayment(payment);
        this[save]();
    }

    /**
     * Format the provided number based on the current Storage set locale and currency.
     *
     * @param {Number} amount
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat(this[internal].storage.locale, {
            style: 'currency',
            currency: this[internal].storage.currency
        }).format(amount);
    }

    /**
     * Add an event listener to the object.
     *
     * @param {String} event
     * @param {Function} handler
     */
    addEventListener(event, handler) {
        if (typeof handler !== "function") {
            throw new TypeError("handler is not a function");
        }

        switch (event.toLowerCase()) {
            case 'change':
                this[internal].onchange.push(handler);
                return;
        }
    }

    /**
     * Attempt to translate the provided text into the users language.
     *
     * @param {String} string
     * @param {...String} placeholders
     */
    translate(string, ...placeholders) {
        let value = Strings.tryTranslate(this.locale, string);

        for (let p = 0; p < placeholders.length; placeholders++) {
            value = value.replace(new RegExp('\\{' + p + '\\}', 'gi'), placeholders[p]);
        }

        return value;
    }

    /**
     * @returns {String}
     */
    get locale() {
        return this[internal].storage.locale;
    }

    set locale(value) {
        if (this.locales.find(l => l.locale === value) === undefined){
            throw new RangeError("locale does not exist");
        }

        if (this[internal].storage.locale !== value) {
            this[internal].storage.locale = value;
            this[save]();
        }
    }

    /**
     * @returns {String}
     */
    get currency() {
        return this[internal].storage.currency;
    }

    set currency(value) {
        if (this.currencies.find(c => c.code === value) === undefined){
            throw new RangeError("currency does not exist");
        }

        if (this[internal].storage.currency !== value) {
            this[internal].storage.currency = value;
            this[save]();
        }
    }

    get defaultCurrency(){
        return Strings.currencies.find(c => c.code === this.translate("__CURRENCY__"));
    }

    get currencies() {
        return Strings.currencies;
    }

    get locales() {
        return Strings.locales;
    }

    /**
     * Encrypts the current storage set with the provided password, and returns the result.
     *
     * @param {String} password must be at least 6 characters long.
     * @throws {Error} if encryption isn't supported.
     * @throws {TypeError} if the password isn't a string or is too weak.
     */
    export(password) {
        if (!exportable)
            throw new Error("Your browser doesn't support encryption");

        if (typeof password !== "string" || password.length < 6)
            throw new TypeError("password must be a string at least 6 characters long");

        throw new Error("Not implemented");

        return "";
    }

    toJSON() {
        throw new Error("Not supported");
    }
}