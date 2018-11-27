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
 * @returns {HTMLElement}
 */
String.prototype.toHtml = function () {
    let template = document.createElement('template')
    template.innerHTML = this.trim();
    return template.content.firstChild;
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

const handler = async e => {
    document.getElementById('expected').value = e.caller.formatCurrency(e.caller.expected);
    document.getElementById('paid').value = e.caller.formatCurrency(e.caller.paid);
    document.getElementById('remaining').value = e.caller.formatCurrency(e.caller.remaining);

    let pending = document.getElementById('pending-bills');
    let income = document.getElementById('income');
    let paid = document.getElementById('paid-bills');

    pending.clearChildren();
    income.clearChildren();
    paid.clearChildren();

    await Promise.all([e.caller.getPayments(), e.caller.getTemplates()]).then(values => {
        let payments = values[0];
        let templates = values[1];
        let excessMod = 1 + (e.caller.excessive / 100);

        templates.forEach(t => {
            let cost = t.getCost(payments);
            let excessive = cost > t.amount * excessMod;
            let isPaid = t.isPaid(payments);
            let name = t.name;

            if (t.benefactor !== null) {
                name += ` <span class="benefactor">${t.benefactor}</span>`;
            }

            if (t.amount > 0) {
                if (isPaid || (t.partial && cost !== 0)) {
                    let row = `
                    <tr data-template-id="${t.id}">
                        <td>${name}</td>
                        <td>${e.caller.formatCurrency(t.amount)}</td>
                        <td>${cost === 0 ? '' : e.caller.formatCurrency(cost)}</td>
                        <td>
                            <button class="undo">${e.caller.translate("Undo")}</button>
                        </td>
                    </tr>`.toHtml();

                    if (t.partial) {
                        row.classList.add("partial");
                    }

                    if (!t.partial && cost === 0) {
                        row.classList.add("ignored");
                    }

                    if (excessive) {
                        row.classList.add("excessive");
                    }

                    paid.appendChild(row);
                }

                if (!isPaid) {
                    let remaining = Math.max(0, t.amount - cost);

                    let row = `
                    <tr data-template-id="${t.id}">
                        <td>${name}</td>
                        <td>${e.caller.formatCurrency(t.amount)}</td>
                        <td>${e.caller.formatCurrency(remaining)}</td>
                        <td>
                            <button class="pay">${e.caller.translate("Pay")}</button>
                            <button class="ignore">${e.caller.translate("Ignore")}</button>
                            <button class="edit">${e.caller.translate("Edit")}</button>
                        </td>
                    </tr>`.toHtml();

                    if (t.partial && cost !== 0) {
                        row.classList.add("partial");
                    }

                    if (excessive) {
                        row.classList.add("excessive");
                    }

                    pending.appendChild(row);
                }
            } else {
                let row = `
                <tr data-template-id="${t.id}">
                    <td>${name}</td>
                    <td>${e.caller.formatCurrency(t.amount * -1)}</td>
                    <td>${isPaid ? e.caller.formatCurrency(cost * -1) : ''}</td>
                    <td>
                        <button class="edit">${e.caller.translate("Edit")}</button>
                        <button class="cancel"${isPaid ? "" : " hidden"}>${e.caller.translate("Undo")}</button>
                        <button class="pay"${isPaid ? "hidden" : " "}>${e.caller.translate("Pay")}</button>
                    </td>
                </tr>`.toHtml();

                if (cost > t.amount && isPaid) {
                    row.classList.add("excessive");
                }

                income.appendChild(row);
            }
        });

        if (pending.children.length === 0) {
            pending.appendChild(`<tr><td colspan="5" class="empty">${engine.translate("No pending bills!")}</td></tr>`.toHtml());
        }

        if (income.children.length === 0) {
            income.appendChild(`<tr><td colspan="4" class="empty">${engine.translate("No pending income!")}</td></tr>`.toHtml());
        }

        if (paid.children.length === 0) {
            paid.appendChild(`<tr><td colspan="4" class="empty">${engine.translate("No paid bills!")}</td></tr>`.toHtml());
        }

    });

    document.getElementById('month').removeAttribute('disabled');
    document.getElementById('now').removeAttribute('disabled');
    document.getElementById('locale').value = e.caller.locale;
    document.getElementById('currency').value = e.caller.currency;
    document.getElementById('excessive').value = e.caller.excessive;
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

    document.getElementById('month').value = engine.month.toMonthString();
    document.getElementById('month').addEventListener('change', e => {
        e.target.setAttribute('disabled', '');
        document.getElementById('now').setAttribute('disabled', '');

        engine.month = new Date(e.target.value + "-01")
    });

    let locales = document.getElementById("locale");
    let currencies = document.getElementById("currency");
    let excessive = document.getElementById("excessive");

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
    excessive.addEventListener("change", e => engine.excessive = e.target.value);

    translate(engine);

    document.getElementById('now').addEventListener('click', async e => {
        e.target.setAttribute('disabled', '');
        document.getElementById('month').setAttribute('disabled', '');

        var date = new Date(Date.now()).toMonthString();
        engine.month = new Date(date + "-01");
        document.getElementById('month').value = date;
    });

    document.getElementById('export').addEventListener('click', async e => {
        e.preventDefault();

        try {
            let password = await dialogs.prompt({ text: "Please provide a password:", type: "password"});

            if (password === null) {
                return;
            }

            let encrypted = await engine.export(password),
                date = new Date(Date.now()),
                blob = new Blob([encrypted], { type: "binary/octet-stream" });

            let link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `backup-${date.getFullYear()}-${date.getMonth() < 9 ? "0" : ""}${date.getMonth() + 1}-${date.getDate() < 10 ? "0" : ""}${date.getDate()}.money`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
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
                        let password = await dialogs.prompt({ text: "Backup password:", type: "password" });
                        if (password === null)
                            return;

                        try {
                            let version = await engine.import(password, new Uint8Array(read.target.result));
                            await dialogs.alert("Data restored successfully (v{0}).", version);
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

                reader.readAsArrayBuffer(files.item(0));
            }
        } catch (error) {
            dialogs.alert("Import failed: {0}.", error.message);
        }
    });

    document.querySelectorAll('main tbody').forEach(e => e.addEventListener('click', async e => {
        if (e.target instanceof HTMLElement) {
            switch (e.target.nodeName) {
                case "BUTTON":
                    e.preventDefault();

                    let templateId = e.target.closest("tr").dataset.templateId;
                    let template = await engine.getTemplate(templateId);

                    if (e.target.classList.contains("pay")) {
                        let options = {
                            text: template.amount > 0 ? "Total cost:" : "Total received:",
                            type: "number",
                            step: "0.01",
                            min: 0,
                            value: template.amount * -1
                        },
                            amount = await dialogs.prompt(options);
                        if (amount === null) {
                            return;
                        }

                        amount = parseFloat(amount);

                        if (isNaN(amount)) {
                            await dialogs.alert("You must provide a valid amount.");
                            return;
                        }

                        if (template.amount < 0) {
                            amount *= -1;
                        }

                        if (template.partial && await dialogs.confirm("Close the {0} bill?", template.name)) {
                            await engine.addPayment(templateId, amount, true);
                        } else {
                            await engine.addPayment(templateId, amount);
                        }
                    }

                    if (e.target.classList.contains("ignore") && await dialogs.confirm("Ignore {0} for this cycle?", template.name)) {
                        await engine.addPayment(templateId, 0, true);
                    }

                    if (e.target.classList.contains("edit")) {
                        let income = template.amount < 0;
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
                                                    id: template.id,
                                                    created: template.created,
                                                    name: children.find(i => i.name === "name").value,
                                                    amount: parseFloat(children.find(i => i.name === "cost").value) * (income ? -1 : 1),
                                                    startDate: start === "" ? null : new Date(start + "-01"),
                                                    endDate: end === "" ? null : new Date(end + "-01"),
                                                    recurrence: parseInt(children.find(i => i.name === "recurrency").value),
                                                    partial: income ? false : children.find(i => i.name === "partial").checked
                                                };

                                                if (result.name + "" === "") {
                                                    await dialogs.alert("Please provide a {0}.", engine.translate("Name"));
                                                    return;
                                                }

                                                if (isNaN(result.amount) || result.amount === 0.0) {
                                                    await dialogs.alert("Please provide a {0}.", income ? engine.translate("Value") : engine.translate("Cost"));
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
                                            { node: "label", text: engine.translate("Name"), },
                                            { node: "input", name: "name", value: template.name },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Cost"), class: "cost-label" },
                                            { node: "input", name: "cost", type: "number", step: "0.01", min: "0", value: template.amount },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Start Date") },
                                            { node: "input", name: "start", type: "month", value: template.startDate ? template.startDate.toMonthString() : "" },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("End Date") },
                                            { node: "input", name: "end", type: "month", value: template.endDate ? template.endDate.toMonthString() : "" },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Recurrence") },
                                            {
                                                node: "select",
                                                name: "recurrency",
                                                children: engine.recurrencies.map(r => { return {
                                                    node: "option",
                                                    value: r.id,
                                                    text: r.name
                                                }}),
                                                value: template.recurrence
                                            },
                                            { node: "br" },
                                            { node: "label", text: engine.translate("Partial Payments"),  },
                                            { node: "input", name: "partial", type: "checkbox" },
                                            { node: "br" },
                                            { node: "input", type: "submit", value: engine.translate('Save') },
                                            { node: "input", type: "reset", value: engine.translate('Cancel') },
                                            {
                                                node: "button",
                                                text: engine.translate("Delete"),
                                                events: {
                                                    click: async e => {
                                                        e.preventDefault();
                                                        e.target.closest('dialog').close();
                                                        document.body.removeChild(e.target.closest('dialog'));

                                                        if (await dialogs.confirm("Are you sure you want to delete {0} and all it's payment history?", template.name)) {
                                                            engine.deleteTemplate(template);
                                                            resolve(null);
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            });

                            if (template.partial) {
                                dialog.querySelector('[name="partial"]').checked = true;
                            }

                            if (income) {
                                dialog.querySelector('h3').innerHTML = engine.translate("Edit Income");
                                dialog.querySelector('.cost-label').innerHTML = engine.translate("Value");
                                dialog.querySelector('[name="cost"]').value = template.amount * -1;

                                let partial = dialog.querySelector('[name="partial"]'),
                                    elements = Array.from(partial.parentElement.children),
                                    index = elements.indexOf(partial),
                                    label = elements[index - 1],
                                    br = elements[index + 1];

                                partial.parentElement.removeChild(label);
                                partial.parentElement.removeChild(br);
                                partial.parentElement.removeChild(partial);
                            }

                            document.body.append(dialog);
                            dialog.showModal();
                        });

                        if (result instanceof Template) {
                            engine.addOrUpdateTemplate(result);
                        }
                    }

                    if (e.target.classList.contains("undo")) {
                        var payments = await engine.getPayments().then(result => result.filter(p => p.templateId.equalTo(template.id)));
                        if (template.partial && payments.length > 1) {
                            let dialog = elementTemplate({
                                node: "dialog",
                                children: [
                                    {
                                        node: "form",
                                        events: {
                                            submit: async e => {
                                                e.preventDefault();
                                                let value = Array.from(e.target.children).find(e => e.name === "payment").value;

                                                document.body.removeChild(dialog);
                                                await engine.undoPayment(value);
                                            },
                                            reset: e => {
                                                e.preventDefault();
                                                document.body.removeChild(dialog);
                                            }
                                        },
                                        children: [
                                            { node: "h3", text: engine.translate("Select payment to cancel.") },
                                            { node: "p", text: engine.translate("{0} is made of multiple sub-payments, please select which you want to cancel.", template.name) },
                                            {
                                                node: "select",
                                                name: "payment",
                                                children: payments.map(p => { return {
                                                    node: "option",
                                                    text: `${p.created.toDateString()} - ${engine.formatCurrency(p.amount)}`,
                                                    value: p.id
                                                }})
                                            },
                                            { node: "br" },
                                            {
                                                node: "button",
                                                text: engine.translate("Re-open"),
                                                events: {
                                                    click: async e => {
                                                        e.preventDefault();
                                                        let payment = payments.find(p => p.closePartial);
                                                        if (payment !== undefined) {
                                                            payment.closePartial = false;
                                                            await engine.addPayment(payment);
                                                        }
                                                        document.body.removeChild(dialog);
                                                    }
                                                }
                                            },
                                            { node: "input", type: "submit", value: engine.translate("Delete") },
                                            { node: "input", type: "reset", value: engine.translate("Cancel") }
                                        ]
                                    }
                                ]
                            });

                            document.body.appendChild(dialog);
                            dialog.showModal();
                        } else if (await dialogs.confirm("Undo this payment?")) {
                            await engine.undoPayment(payments[0]);
                        }
                    }
                    return;
            }
        }
    }));

    document.querySelectorAll('button.schedule').forEach(e => e.addEventListener('click', async e => {
        let income = e.target.classList.contains("income");
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
                                    partial: income ? false : children.find(i => i.name === "partial").checked
                                };

                                if (result.name + "" === "") {
                                    await dialogs.alert("Please provide a {0}.", engine.translate("Name"));
                                    return;
                                }

                                if (isNaN(result.amount) || result.amount === 0.0) {
                                    await dialogs.alert("Please provide a {0}.", income ? engine.translate("Cost") : engine.translate("Value"));
                                    return;
                                }

                                if (income) {
                                    result.amount = result.amount * -1;
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
                            { node: "label", text: engine.translate("Cost"), class: "cost-label" },
                            { node: "input", name: "cost", type: "number", step: "0.01", min: "0" },
                            { node: "br" },
                            { node: "label", text: engine.translate("Start Date") },
                            { node: "input", name: "start", type: "month", value: document.getElementById('month').value },
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

            if (income) {
                dialog.querySelector('h3').innerHTML = engine.translate("Schedule Income");
                dialog.querySelector('.cost-label').innerHTML = engine.translate("Value");

                let partial = dialog.querySelector('[name="partial"]'),
                    elements = Array.from(partial.parentElement.children),
                    index = elements.indexOf(partial),
                    label = elements[index - 1],
                    br = elements[index + 1];

                partial.parentElement.removeChild(label);
                partial.parentElement.removeChild(br);
                partial.parentElement.removeChild(partial);
            }

            document.body.appendChild(dialog);
            dialog.showModal();
        });

        if (template instanceof Template) {
            engine.addOrUpdateTemplate(template);
        }
    }));

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
