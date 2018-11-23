"use strict";

import PaymentEngine from './engine.js';

HTMLElement.prototype.clearChildren = function() {
    while(this.firstChild) {
        this.removeChild(this.firstChild);
    }
}

Date.prototype.toMonthString = function () {
    var result = this.getFullYear() + "-";
    var month = this.getMonth() + 1;
    if (month < 10)
        result += "0";

    result += month;
    return result;
}

/**
 * @type {PaymentEngine}
 */
let engine = {};

const dialogs = {
    /**
     * @param {String} message
     * @returns {Promise<void>}
     */
    alert: async (message) => {
        return new Promise(resolve => {
            let dialog = document.createElement('dialog'),
                text = document.createElement('p'),
                button = document.createElement('button');

            text.textContent = message;
            button.textContent = engine.translate('Close');
            button.addEventListener('click', () => {
                resolve();
                dialog.removeAttribute('open');
                document.body.removeChild(dialog);
            })

            dialog.appendChild(text);
            dialog.appendChild(button);
            document.body.appendChild(dialog);
            dialog.setAttribute('open', '');
        });
    },

    /**
     * @param {String} message
     * @param {String} [type=text] Input type.
     * @returns {Promise<String>}
     */
    prompt: async(message, type="text") => {
        return new Promise(resolve => {
            let dialog = document.createElement('dialog'),
                form = document.createElement('form'),
                text = document.createElement('p'),
                input = document.createElement('input'),
                button = document.createElement('input'),
                cancel = document.createElement('input');

            text.textContent = message;

            input.type = type;
            input.autocomplete = "no";

            button.value = engine.translate('OK');
            button.type = "submit";

            cancel.value = engine.translate('Cancel');
            cancel.type = "reset";

            form.addEventListener('submit', e => {
                e.preventDefault();
                resolve(input.value);
                dialog.removeAttribute('open');
                document.body.removeChild(dialog);
            });

            form.addEventListener('reset', e => {
                e.preventDefault();
                resolve(null);
                dialog.removeAttribute('open');
                document.body.removeChild(dialog);
            })

            form.appendChild(input);
            form.appendChild(document.createElement('br'));
            form.appendChild(button);
            form.appendChild(cancel);

            dialog.appendChild(form);
            document.body.appendChild(dialog);
            dialog.setAttribute('open', '');
        });
    },

    /**
     * @param {String} message
     * @returns {Promise<boolean>}
     */
    confirm: async(message) => {
        return new Promise(resolve => {
            let dialog = document.createElement('dialog'),
                text = document.createElement('p'),
                accept = document.createElement('button'),
                decline = document.createElement('button');

            text.innerHTML = message;

            accept.textContent = engine.translate('Yes');
            accept.addEventListener('click', () => {
                resolve(true);
                dialog.removeAttribute('open');
                document.body.removeChild(dialog);
            });

            decline.textContent = engine.translate('No');
            decline.addEventListener('click', () => {
                resolve(false);
                dialog.removeAttribute('open');
                document.body.removeChild(dialog);
            })

            dialog.appendChild(text);
            dialog.appendChild(document.createElement('br'));
            dialog.appendChild(accept);
            dialog.appendChild(decline);
            document.body.appendChild(dialog);
            dialog.setAttribute('open', '');
        });
    }
}

const handler = e => {
    document.getElementById('expected').value = e.caller.formatCurrency(e.caller.expected);
    document.getElementById('paid').value = e.caller.formatCurrency(e.caller.paid);
    document.getElementById('remaining').value = e.caller.formatCurrency(e.caller.remaining);

    let pending = document.getElementById('pending-bills');
    let income = document.getElementById('income');
    let paid = document.getElementById('paid-bills');

    pending.clearChildren();
    income.clearChildren();
    paid.clearChildren();

    let payments = e.caller.payments;
    e.caller.templates.sort((t1, t2) => {
        if (t1.name > t2.name)
            return 1;

        if (t1.name < t2.name)
            return -1;

        return 0;
    }).forEach(t => {
        let row = document.createElement('template');
        let cost = t.getCost(payments);
        let excessive = cost > t.amount;
        let isPaid = t.isPaid(payments);
        let name = t.name;

        if (t.benefactor !== null) {
            name += ` <span class="benefactor">${t.benefactor}</span>`;
        }

        if (t.amount > 0) {
            if (isPaid) {
                row.innerHTML = `
                <tr data-template-id="${t.id}">
                    <td>${name}</td>
                    <td>${e.caller.formatCurrency(t.amount)}</td>
                    <td>${e.caller.formatCurrency(cost)}</td>
                    <td>
                        <button class="undo">${e.caller.translate("Undo")}</button>
                    </td>
                </tr>`.trim();

                if (excessive) {
                    row.content.firstChild.classList.add("excessive");
                }
                paid.appendChild(row.content.firstChild);
            } else {
                let remaining = Math.max(0, t.amount - cost);

                row.innerHTML = `
                <tr data-template-id="${t.id}">
                    <td>${name}</td>
                    <td>${e.caller.formatCurrency(t.amount)}</td>
                    <td>${e.caller.formatCurrency(remaining)}</td>
                    <td>
                        <button class="pay">${e.caller.translate("Pay")}</button>
                        <button class="ignore">${e.caller.translate("Ignore")}</button>
                    </td>
                </tr>`.trim();

                if (excessive) {
                    row.content.firstChild.classList.add("excessive");
                }
                pending.appendChild(row.content.firstChild);
            }
        } else {
            row.innerHTML = `
            <tr data-template-id="${t.id}">
                <td>${name}</td>
                <td>${e.caller.formatCurrency(t.amount * -1)}</td>
                <td>${e.caller.formatCurrency(cost * -1)}</td>
                <td>
                    <button class="cancel"${isPaid ? "" : " hidden"}>${e.caller.translate("Cancel")}</button>
                    <button class="pay"${isPaid ? "hidden" : " "}>${e.caller.translate("Pay")}</button>
                </td>
            </tr>`.trim();

            if (excessive) {
                row.content.firstChild.classList.add("excessive");
            }
            income.appendChild(row.content.firstChild);
        }
    });

    document.getElementById('locale').value = e.caller.locale;
    document.getElementById('currency').value = e.caller.currency;
    translate(e.caller);
}

const translate = engine => document.querySelectorAll(".translate").forEach(e => {
    let value = e.innerHTML.trim();
    let current = value;

    if (e.dataset.baseTranslation === undefined) {
        e.dataset.baseTranslation = value;
    } else {
        value = e.dataset.baseTranslation;
    }

    let translation = engine.translate(value);

    if (current !== translation) {
        e.innerHTML = translation;
    }
});

document.addEventListener("DOMContentLoaded", e => {
    engine = new PaymentEngine();
    engine.addEventListener('change', handler);
    handler({ caller: engine });

    document.getElementById('month').value = engine.month.toMonthString();
    document.getElementById('month').addEventListener('change', e => engine.month = new Date(e.target.value + "-01"));

    let locales = document.getElementById("locale");
    let currencies = document.getElementById("currency");

    engine.locales.forEach(e => locales.appendChild(new Option(e.name, e.locale)));
    locales.value = engine.locale;
    locales.addEventListener("change", async e => {
        engine.locale = e.target.value;
        let defaultCurrency = engine.defaultCurrency;
        if (defaultCurrency.code !== currencies.value && await dialogs.confirm(engine.translate("Switch to local currency {0}?", defaultCurrency.name))) {
            engine.currency = defaultCurrency.code;
        }
    });

    engine.currencies.forEach(e => currencies.appendChild(new Option(e.name, e.code)));
    currencies.value = engine.currency;
    currencies.addEventListener("change", e => engine.currency = e.target.value);

    translate(engine);

    document.getElementById('export').addEventListener('click', async e => {
        e.preventDefault();

        try {
            let password = await dialogs.prompt(engine.translate("Please provide a password:"), "password");

            if (password === null) {
                return;
            }

            let encrypted = await engine.export(password),
                date = new Date(Date.now()),
                a = document.createElement('a');

            a.setAttribute('href', "data:text/plain;charset=utf-8," + encodeURIComponent(encrypted));
            a.setAttribute('download', 'export-' + date.getFullYear() + "-" + (date.getMonth() < 9 ? "0" : "") + (date.getMonth() + 1) + "-" + date.getDate() + ".bak");
            a.setAttribute('hidden', '');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch(e) {
            await dialogs.alert(engine.translate("Export failed: {0}.", e.message));
        }
    });

    document.getElementById('import').addEventListener('click', async e => {
        if (await dialogs.confirm(engine.translate("Restoring a backup will overwrite your existing data, continue?"))) {
            document.getElementById('backup').click();
        }
    });

    document.getElementById('backup').addEventListener('change', async change => {
        try {
            /**
             * @type FileList
             */
            let files = change.target.files;

            if (files.length === 1) {
                let reader = new FileReader();
                reader.onload = async read => {
                    change.target.value = "";
                    try {
                        let result = JSON.parse(read.target.result);

                        if (result.cypherText === undefined || result.iv === undefined) {
                            throw new Error(engine.translate("Invalid backup selected"));
                        }

                        let password = await dialogs.prompt(engine.translate("Backup password:"), "password");
                        if (password === null)
                            return;

                        try {
                            await engine.import(password, result);
                        } catch (e) {
                            if (e.name === "OperationError") {
                                await dialogs.alert(engine.translate("Import failed: {0}.", engine.translate("Invalid backup password")));
                            } else {
                                await dialogs.alert(engine.translate("Import failed: {0}.", e.message));
                            }
                        }
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            throw new Error(engine.translate("Invalid backup selected"));
                        } else {
                            throw e;
                        }
                    }
                };

                reader.onerror = read => {
                    read.target.abort();
                    change.target.value = "";
                    throw read.error;
                };

                reader.readAsText(files.item(0));
            }
        } catch (error) {
            dialogs.alert(engine.translate("Import failed: {0}.", error.message));
        }
    });

    document.querySelector('main tbody').addEventListener('click', async e => {
        if (e.target instanceof HTMLElement) {
            switch (e.target.nodeName) {
                case "BUTTON":
                    e.preventDefault();

                    let templateId = e.target.closest("tr").dataset.templateId;
                    let template = engine.templates.find(t => t.id === templateId);

                    if (e.target.classList.contains("pay")) {
                        let amount = await dialogs.prompt(template.amount > 0 ? engine.translate("Total cost:") : engine.translate("Total received:"), "number");
                        amount = parseFloat(amount);

                        if (template.amount < 0) {
                            amount *= -1;
                        }

                        if (template.partial && await dialogs.confirm(engine.translate("Close the {0} bill?", template.name))) {
                            engine.addPayment(templateId, amount, final);
                        } else {
                            engine.addPayment(templateId, amount);
                        }
                    }

                    if (e.target.classList.contains("ignore") && await dialogs.confirm(engine.translate("Ignore {0} for this cycle?", template.name))) {
                        engine.addPayment(templateId, 0, true);
                    }
                    return;
            }
        }
    });

    document.querySelectorAll("#tab-picker a").forEach(e => e.addEventListener("click", e => {
        e.preventDefault();
        if (e.target.classList.contains("active")) {
            return;
        }
        let target = e.target.href.split('#')[1];
        localStorage.eyeActiveTab = target;

        document.querySelectorAll("main section").forEach(e => e.setAttribute("hidden", ""));
        document.querySelectorAll("#tab-picker a.active").forEach(e => e.classList.remove('active'));
        e.target.classList.add("active");
        document.getElementById(target).removeAttribute("hidden");
    }));

    if (localStorage.eyeActiveTab !== undefined) {
        Array.from(document.querySelectorAll('#tab-picker a')).find(a => a.href.split('#')[1] === localStorage.eyeActiveTab).click();
    }

    document.body.classList.remove("loading");
});