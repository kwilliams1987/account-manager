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
    let engine = new PaymentEngine();
    engine.addEventListener('change', handler);
    handler({ caller: engine });

    document.getElementById('month').value = engine.month.toMonthString();
    document.getElementById('month').addEventListener('change', e => {
        engine.month = e.target.value;
    });

    let locales = document.getElementById("locale");
    let currencies = document.getElementById("currency");

    engine.locales.forEach(e => locales.appendChild(new Option(e.name, e.locale)));
    locales.value = engine.locale;
    locales.addEventListener("change", e => {
        engine.locale = e.target.value;
        let defaultCurrency = engine.defaultCurrency;
        if (defaultCurrency.code !== currencies.value && confirm(engine.translate("Switch to local currency {0}?", defaultCurrency.name))) {
            engine.currency = defaultCurrency.code;
        }
    });

    engine.currencies.forEach(e => currencies.appendChild(new Option(e.name, e.code)));
    currencies.value = engine.currency;
    currencies.addEventListener("change", e => engine.currency = e.target.value);

    translate(engine);
    document.querySelector('body').classList.add("loaded");

    document.querySelectorAll('main tbody').forEach(e => e.addEventListener('click', e => {
        if (e.target instanceof HTMLElement) {
            if (e.target.nodeName === 'TBODY') {
                return;
            }

            if (e.target.nodeName === "BUTTON") {
                e.preventDefault();

                let templateId = e.target.closest("tr").dataset.templateId;
                let template = engine.templates.find(t => t.id === templateId);

                if (e.target.classList.contains("pay")) {
                    let amount = parseFloat(prompt(template.amount > 0 ? engine.translate("Total cost:") : engine.translate("Total received:")));

                    if (template.amount < 0) {
                        amount *= -1;
                    }

                    let final = false;
                    if (template.partial) {
                        final = confirm(engine.translate("Close the {0} bill?", template.name));
                    }

                    engine.addPayment(templateId, amount, final);
                }

                if (e.target.classList.contains("ignore")) {
                    if (confirm(engine.translate("Ignore {0} for this cycle?", template.name))) {
                        engine.addPayment(templateId, 0, true);
                    }
                }
            }
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
});