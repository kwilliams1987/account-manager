"use strict";

import { PaymentEngine } from './engine.js';
import { elementTemplate, DialogManager } from './dialogs.js';
import { Template } from './model/template.js';
import { Recurrence } from './model/recurrence.js';

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

/**
 *
 * @type {DialogManager}
 */
let dialogs = {};

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

                row.content.firstChild.dataset.entity = t;
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
                        <button class="edit">${e.caller.translate("Edit")}</button>
                    </td>
                </tr>`.trim();

                if (excessive) {
                    row.content.firstChild.classList.add("excessive");
                }

                row.content.firstChild.dataset.entity = t;
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

            row.content.firstChild.dataset.entity = t;
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
    dialogs = new DialogManager(engine);

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
        if (defaultCurrency.code !== currencies.value && await dialogs.confirm("Switch to local currency {0}?", defaultCurrency.name)) {
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
            let password = await dialogs.prompt({ text: "Please provide a password:", type: "password"});

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
            await dialogs.alert("Export failed: {0}.", e.message);
        }
    });

    document.getElementById('import').addEventListener('click', async e => {
        if (await dialogs.confirm("Restoring a backup will overwrite your existing data, continue?")) {
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

                        let password = await dialogs.prompt({ text: "Backup password:", type: "password" });
                        if (password === null)
                            return;

                        try {
                            await engine.import(password, result);
                        } catch (e) {
                            if (e.name === "OperationError") {
                                await dialogs.alert("Import failed: {0}.", engine.translate("Invalid backup password"));
                            } else {
                                await dialogs.alert("Import failed: {0}.", e.message);
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
            dialogs.alert("Import failed: {0}.", error.message);
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
                        let amount = await dialogs.prompt({ text: template.amount > 0 ? "Total cost:" : "Total received:", type: "number" });
                        amount = parseFloat(amount);

                        if (template.amount < 0) {
                            amount *= -1;
                        }

                        if (template.partial && await dialogs.confirm("Close the {0} bill?", template.name)) {
                            engine.addPayment(templateId, amount, final);
                        } else {
                            engine.addPayment(templateId, amount);
                        }
                    }

                    if (e.target.classList.contains("ignore") && await dialogs.confirm("Ignore {0} for this cycle?", template.name)) {
                        engine.addPayment(templateId, 0, true);
                    }

                    if (e.target.classList.contains("edit")) {
                        let record = e.target.closest('tr').dataset.entity;
                        /**
                         * @type {Template}
                         */
                        let result = await new Promise(resolve => {
                            let dialog = elementTemplate({
                                node: "dialog",
                                children: [
                                    { node: "h3", text: engine.translate("Edit Schedule") },
                                    {
                                        node: "form",
                                        events: {
                                            'submit': async e => {
                                                e.preventDefault();

                                                /**
                                                 * @type {HTMLElement[]}
                                                 */
                                                let children = Array.from(e.target.children);
                                                let start = children.find(i => i.name === "start").value;
                                                let end = children.find(i => i.name === "end").value;

                                                let result = {
                                                    id: record.id,
                                                    created: record.created,
                                                    name: children.find(i => i.name === "name").value,
                                                    amount: parseFloat(children.find(i => i.name === "cost").value),
                                                    startDate: start === "" ? null : new Date(start + "-01"),
                                                    endDate: end === "" ? null : new Date(end + "-01"),
                                                    recurrence: parseInt(children.find(i => i.name === "recurrency").value),
                                                    partial: children.find(i => i.name === "partial").checked
                                                };

                                                if (result.name + "" === "") {
                                                    await dialogs.alert("Please provide a {0}.", engine.translate("Name"));
                                                    return;
                                                }

                                                if (isNaN(result.amount) || result.amount === 0.0) {
                                                    await dialogs.alert("Please provide a {0}.", engine.translate("Cost"));
                                                    return;
                                                }

                                                if (result.startDate !== null && result.endDate !== null && result.startDate > result.endDate) {
                                                    await dialogs.alert("Date range is invalid.");
                                                    return;
                                                }

                                                if (result.start === null && result.recurrence !== Recurrence.never && result.recurrence !== Recurrence.monthly) {
                                                    await dialogs.alert("Cannot use this recurrency without a start date.");
                                                    return;
                                                }

                                                resolve(new Template(result));
                                                e.target.closest('dialog').close();
                                                document.body.removeChild(e.target.closest('dialog'));
                                            },
                                            'reset': e => {
                                                e.preventDefault();
                                                resolve(null);
                                                e.target.closest('dialog').close();
                                                document.body.removeChild(e.target.closest('dialog'));
                                            }
                                        },
                                        children: [
                                            { node: "label", text: engine.translate("Name"), value: record.name },
                                            { node: "input", name: "name" },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Cost") },
                                            { node: "input", name: "cost", type: "number", step: "0.01", min: "0" },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Start Date") },
                                            { node: "input", name: "start", type: "month" },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("End Date") },
                                            { node: "input", name: "end", type: "month" },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Recurrence") },
                                            {
                                                node: "select",
                                                name: "recurrency",
                                                children: engine.recurrencies.map(r => { return {
                                                    node: "option",
                                                    value: r.id,
                                                    text: r.name
                                                }})
                                            },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Partial Payments") },
                                            { node: "input", name: "partial", type: "checkbox" },
                                            { node: "br" },
                                            { node: "input", type: "submit", value: engine.translate('Save') },
                                            { node: "input", type: "reset", value: engine.translate('Cancel') },
                                            {
                                                node: "button",
                                                text: engine.translate("Delete"),
                                                events: {
                                                    click: async e => {
                                                        if (await dialogs.confirm("Are you sure you want to delete {0} and all it's payment history?", record.name)) {
                                                            engine.deleteTemplate(record);
                                                            resolve(null);
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            });

                            document.body.append(dialog);
                            dialog.showModal();
                        });

                        if (result instanceof Template) {
                            engine.addOrUpdateTemplate(result);
                        }
                    }
                    return;
            }
        }
    });

    document.getElementById('schedule-bill').addEventListener('click', async e => {
        let template = await new Promise(resolve => {
            let dialog = elementTemplate({
                node: "dialog",
                children: [
                    { node: "h3", text: engine.translate("Schedule Bill") },
                    {
                        node: "form",
                        events: {
                            'submit': async e => {
                                e.preventDefault();

                                /**
                                 * @type {HTMLElement[]}
                                 */
                                let children = Array.from(e.target.children);
                                let start = children.find(i => i.name === "start").value;
                                let end = children.find(i => i.name === "end").value;

                                let result = {
                                    name: children.find(i => i.name === "name").value,
                                    amount: parseFloat(children.find(i => i.name === "cost").value),
                                    startDate: start === "" ? null : new Date(start + "-01"),
                                    endDate: end === "" ? null : new Date(end + "-01"),
                                    recurrence: parseInt(children.find(i => i.name === "recurrency").value),
                                    partial: children.find(i => i.name === "partial").checked
                                };

                                if (result.name + "" === "") {
                                    await dialogs.alert("Please provide a {0}.", engine.translate("Name"));
                                    return;
                                }

                                if (isNaN(result.amount) || result.amount === 0.0) {
                                    await dialogs.alert("Please provide a {0}.", engine.translate("Cost"));
                                    return;
                                }

                                if (result.startDate !== null && result.endDate !== null && result.startDate > result.endDate) {
                                    await dialogs.alert("Date range is invalid.");
                                    return;
                                }

                                if (result.start === null && result.recurrence !== Recurrence.never && result.recurrence !== Recurrence.monthly) {
                                    await dialogs.alert("Cannot use this recurrency without a start date.");
                                }

                                resolve(new Template(result));
                                e.target.closest('dialog').close();
                                document.body.removeChild(e.target.closest('dialog'));
                            },
                            'reset': e => {
                                e.preventDefault();
                                resolve(null);
                                e.target.closest('dialog').close();
                                document.body.removeChild(e.target.closest('dialog'));
                            }
                        },
                        children: [
                            { node: "label", text: engine.translate("Name") },
                            { node: "input", name: "name" },
                            { node: "br" },
                            { node: "label", text: engine.translate("Cost") },
                            { node: "input", name: "cost", type: "number", step: "0.01", min: "0" },
                            { node: "br" },
                            { node: "label", text: engine.translate("Start Date") },
                            { node: "input", name: "start", type: "month" },
                            { node: "br" },
                            { node: "label", text: engine.translate("End Date") },
                            { node: "input", name: "end", type: "month" },
                            { node: "br" },
                            { node: "label", text: engine.translate("Recurrence") },
                            {
                                node: "select",
                                name: "recurrency",
                                children: engine.recurrencies.map(r => { return {
                                    node: "option",
                                    value: r.id,
                                    text: r.name
                                }})
                            },
                            { node: "br" },
                            { node: "label", text: engine.translate("Partial Payments") },
                            { node: "input", name: "partial", type: "checkbox" },
                            { node: "br" },
                            { node: "input", type: "submit", value: engine.translate('Save') },
                            { node: "input", type: "reset", value: engine.translate('Cancel') }
                        ]
                    }
                ]
            });

            document.body.appendChild(dialog);
            dialog.showModal();
        });

        if (template instanceof Template) {
            engine.addOrUpdateTemplate(template);
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
