"use strict";

if (localStorage === undefined)
    throw new Error("Local Storage is not supported.");

import { Guid } from "./utils/guid.js";
import { Template } from "./model/template.js";
import { Payment } from "./model/payment.js";
import { MoneyStorage } from "./storage.js";
import { Strings, ITranslate } from "./strings.js";
import { Recurrence } from "./model/recurrence.js";

const exportable = crypto !== undefined && crypto.subtle !== undefined;
const internal = Symbol("internal");
const save = Symbol("save");

class PaymentEngine extends ITranslate {
    /**
     * Bind a payment engine to the current window.
     */
    constructor() {
        super();

        this[internal] = {
            /**
             * @type {MoneyStorage}
             */
            storage: {},
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
            },
            /**
             * Get default encryption parameters.
             *
             * @returns {AesGcmParams}
             * @param {?Uint8Array} iv
             */
            getAlgorthm(iv) {
                if (iv === undefined) {
                    iv = crypto.getRandomValues(new Uint8Array(16));
                }

                return {
                    name: 'AES-GCM',
                    length: 256,
                    iv: iv
                };
            },
            generateKey: async (password) => {
                if (!exportable)
                    throw new Error(this.translate("Your browser doesn't support encryption"));

                if (typeof password !== "string" || password.length < 6)
                    throw new TypeError(this.translate("Password must be at least {0} characters.", 6));

                var encoder = new TextEncoder();
                var algo = {
                    name: 'PBKDF2',
                    hash: 'SHA-256',
                    salt: encoder.encode("AiAIOsdAAasf"),
                    iterations: 1000
                };
                let key = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2'}, false, ['deriveKey']);
                return crypto.subtle.deriveKey(algo, key, this[internal].getAlgorthm(), false, ['encrypt', 'decrypt']);
            }
        };

        this[save] = async () => {
            localStorage.eyePaymentEngine = JSON.stringify(this[internal].storage);

            this[internal].expected = 0;
            this[internal].paid = 0;
            this[internal].remaining = 0;

            await Promise.all([this.getPayments(), this.getTemplates()]).then(values => {
                let payments = values[0];
                let templates = values[1];

                templates.filter(t => t.amount > 0).forEach(t => {
                    this[internal].expected += t.amount;
                    if (t.partial) {
                        let paid = false;
                        let total = 0;

                        payments.filter(p => p.templateId.equalTo(t.id)).forEach(payment => {
                            total += payment.amount;
                            paid |= payment.closePartial;
                        });

                        if (!paid) {
                            this[internal].remaining += Math.max(0, t.amount - total);
                        }
                    } else if (payments.find(p => p.templateId === t.id) === undefined) {
                        this[internal].remaining += t.amount;
                    }
                });

                payments.filter(p => p.amount > 0).forEach(p => {
                    this[internal].paid += p.amount;
                });


                this[internal].trigger('change');
            });
        }

        try {
            this[internal].storage = new MoneyStorage(localStorage.eyePaymentEngine);
        } catch (e) {
            this[internal].storage = new MoneyStorage();
            localStorage.removeItem("eyePaymentEngine");
        }

        window.addEventListener("storage", e => {
            if (e.key === "eyePaymentEngine") {
                this[internal].storage = new MoneyStorage(e.newValue);
                this[internal].trigger('change');
            }
        });

        this[save]();
    }

    /**
     * Selected month.
     *
     * @returns {Date}
     */
    get month() {
        return this[internal].storage.date;
    }

    set month(value) {
        if (value instanceof Date) {
            if (value != this[internal].storage.date) {
                this[internal].storage.date = value;
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
     * @return {Promise<Payment[]>}
     */
    async getPayments() {
        return this[internal].storage.getPaymentsByMonth(this.month);
    }

    /**
     * Get templates for currently selected month.
     *
     * @return {Promise<Template[]>}
     */
    async getTemplates() {
        return this[internal].storage.getTemplatesByMonth(this.month).then(result => {
            return result.sort((t1, t2) => {
                if (t1.name > t2.name)
                    return 1;

                if (t1.name < t2.name)
                    return -1;

                return 0;
            });
        });
    }

    /**
     * Get template by Id.
     *
     * @param {guid} id
     * @returns {Promise<Template>}
     */
    async getTemplate(id) {
        if (typeof id === "string") {
            id = new Guid(id);
        }

        if (id instanceof Guid) {
            return this[internal].storage.getTemplate(id);
        } else {
            throw new TypeError("id must be a string or Guid");
        }
    }

    /**
     * Attempts to pay the provided template in the current month.
     * Updates a payment if provided.
     *
     * @param {(Payment|Guid|string)} id Template ID
     * @param {Number} amount
     * @param {boolean} [final=false]
     */
    async addPayment(id, amount, final = false) {
        if (id instanceof Payment) {
            payment = id;
        } else {
            if (typeof id === "string")
                id = new Guid(id);

            var template = await this.getTemplate(id);
            if (template === undefined) {
                throw new RangeError("template does not exist in the current month");
            }

            var payments = await this.getPayments();
            payments = payments.filter(p => p.templateId.equalTo(id));
            if (payments.find(p => p.closePartial) || (template.partial === false && payments.length > 0)) {
                throw new RangeError("This template has already been paid");
            }

            var payment = new Payment(template, this.month, amount);
            if (template.partial && final) {
                payment.closePartial = true;
            }
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
     * Add or update the provided template.
     *
     * @param {Template} template
     */
    addOrUpdateTemplate(template){
        this[internal].storage.updateTemplate(template);
        this[save]();
    }

    /**
     * Remove a template and all it's associated payments.
     *
     * @param {Template} template
     */
    deleteTemplate(template) {
        this[internal].storage.removeTemplate(template);
        this[save]();
    }

    /**
     * Undo a payment in the current month.
     *
     * @param {(Guid | String | Payment)} id
     */
    async undoPayment(id) {
        if (typeof id === "string") {
            id = new Guid(id);
        }

        if (id instanceof Payment) {
            id = id.id
        }

        var payment = await this.getPayments().then(payments => payments.find(p => p.id.equalTo(id)));
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

        return super.translate(value, ...placeholders);
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

    get recurrencies() {
        return [
            { id: Recurrence.never, name: this.translate("Never") },
            { id: Recurrence.monthly, name: this.translate("Monthly") },
            { id: Recurrence.bimonthly, name: this.translate("Bi-Monthly") },
            { id: Recurrence.quarterly, name: this.translate("Quarterly") },
            { id: Recurrence.biannually, name: this.translate("Bi-Annually") },
            { id: Recurrence.annually, name: this.translate("Annually") },
        ];
    }

    /**
     * Encrypts the current storage set with the provided password, and returns the result.
     *
     * @param {String} password must be at least 6 characters long.
     * @returns {Promise<string>}
     * @throws {Error} if encryption isn't supported.
     * @throws {TypeError} if the password isn't a string or is too weak.
     */
    async export(password) {
        let key = await this[internal].generateKey(password),
            algo = await this[internal].getAlgorthm(),
            encoder = new TextEncoder();

        let encrypted = new Uint8Array(await crypto.subtle.encrypt(algo, key, encoder.encode(JSON.stringify(this[internal].storage))));
        let output = new Uint8Array(algo.iv.length + encrypted.length);
        output.set(algo.iv);
        output.set(encrypted, algo.iv.length);

        return output;
    }

    /**
     * Decrypts the provided storage set with the password, and overwrites the current dataset.
     *
     * @param {String} password must be at least 6 characters long.
     * @param {Uint8Array} encrypted
     * @returns {Promise<void>}
     * @throws {Error} if encryption isn't supported.
     */
    async import(password, encrypted) {
        let iv = encrypted.subarray(0, 16),
            key = await this[internal].generateKey(password),
            algo = this[internal].getAlgorthm(iv);

        encrypted = encrypted.subarray(16);

        let output = await crypto.subtle.decrypt(algo, key, encrypted),
            result = new TextDecoder().decode(output);

        JSON.parse(result);

        localStorage.eyePaymentEngine = result;
        this[internal].storage = new MoneyStorage(result);
        this[internal].trigger('change');
    }

    toJSON() {
        throw new Error("Not supported");
    }
}

export { PaymentEngine };