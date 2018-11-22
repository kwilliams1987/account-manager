"use strict";

const internal = Symbol("internal");

export default class Strings {
    static get currencies() {
        return [
            { code: "EUR", name: "Euroes" },
            { code: "USD", name: "US Dollars" },
            { code: "GBP", name: "British Pounds" }
        ]
    }

    static get locales() {
        return Object.keys(Strings[internal]).map(prop => {
            return { locale: prop, name: "" + Strings[internal][prop]["__NAME__"] };
        });
    }

    /**
     * Try to translate the provided text into the locale.
     *
     * Returns original value if the locale doesn't have a translation.
     *
     * @param {String} locale
     * @param {String} string
     *
     * @returns {String}
     */
    static tryTranslate(locale, string) {
        if (Strings[internal][locale] !== undefined && Strings[internal][locale][string] !== undefined) {
            return Strings[internal][locale][string];
        } else {
            console.warn(`${locale} is missing a translation for "${string}".`);
            return string;
        }
    }
}

Strings[internal] = {
    "en-GB": {
        "__CURRENCY__": "GBP",
        "__NAME__": "English (UK)",
        "Eye on My.money": "Eye on My.money",
        "Eye on My Money": "Eye on My Money",
        "Overview": "Overview",
        "Settings": "Settings",
        "Payments": "Payments",
        "Month": "Month",
        "Expected": "Expected",
        "Paid": "Paid",
        "Remaining": "Remaining",
        "Pending Bills": "Pending Bills",
        "Name": "Name",
        "Budgetted": "Budgeted",
        "Expected": "Expected",
        "Received": "Received",
        "Unexpected Income": "Unexpected Income",
        "Paid Bills": "Paid Bills",
        "Expected Cost": "Expected Cost",
        "Actual Cost": "Actual Cost",
        "Undo": "Undo",
        "Pay": "Pay",
        "Ignore": "Ignore",
        "Cancel": "Cancel",
        "Total cost:": "Total cost:",
        "Total received:": "Total received:",
        // {0} = name of bill.
        "Close the {0} bill?": "Close the {0} bill?",
        // {0} = name of bill.
        "Ignore {0} for this cycle?": "Ignore {0} for this cycle?",
        "Language:": "Language:",
        "Planned Income": "Planned Income",
        "Unexpected Bill": "Unexpected Bill",
        "Schedule Bill": "Schedule Bill",
        "Schedule Income": "Schedule income",
        "Currency:": "Currency:",
        "Switch to local currency {0}?": "Switch to local currency {0}?"
    },
    "en-US": {
        "__CURRENCY__": "USD",
        "__NAME__": "English (US)",
        "Eye on My.money": "Eye on My.money",
        "Eye on My Money": "Eye on My Money",
        "Overview": "Overview",
        "Settings": "Settings",
        "Payments": "Payments",
        "Month": "Month",
        "Expected": "Expected",
        "Paid": "Paid",
        "Remaining": "Remaining",
        "Pending Bills": "Pending Bills",
        "Name": "Name",
        "Budgetted": "Budgeted",
        "Expected": "Expected",
        "Received": "Received",
        "Unexpected Income": "Unexpected Income",
        "Paid Bills": "Paid Bills",
        "Expected Cost": "Expected Cost",
        "Actual Cost": "Actual Cost",
        "Undo": "Undo",
        "Pay": "Pay",
        "Ignore": "Ignore",
        "Cancel": "Cancel",
        "Total cost:": "Total cost:",
        "Total received:": "Total received:",
        // {0} = name of bill.
        "Close the {0} bill?": "Close the {0} bill?",
        // {0} = name of bill.
        "Ignore {0} for this cycle?": "Ignore {0} for this cycle?",
        "Language:": "Language:",
        "Planned Income": "Planned Income",
        "Unexpected Bill": "Unexpected Bill",
        "Schedule Bill": "Schedule Bill",
        "Schedule Income": "Schedule income",
        "Currency:": "Currency:",
        "Switch to local currency {0}?": "Switch to local currency {0}?"
    },
    "nl-NL": {
        "__CURRENCY__": "EUR",
        "__NAME__": "Nederlands",
        "Eye on My.money": "Eye on My.money",
        "Eye on My Money": "Eye on My Money",
        "Overview": "Overzicht",
        "Settings": "Instellingen",
        "Payments": "Betaalingen",
        "Month": "Maand",
        "Expected": "Verwacht",
        "Paid": "Betaald",
        "Remaining": "Resterende",
        "Pending Bills": "Nog Steeds te betalen",
        "Name": "Naam",
        "Budgetted": "Begroot",
        "Expected": "Expected",
        "Received": "Ontvangen",
        "Unexpected Income": "Onverwacht Inkomen",
        "Paid Bills": "Betaalde rekeningen",
        "Expected Cost": "Verwachte kosten",
        "Actual Cost": "Werkelijke kosten",
        "Undo": "Herstellen",
        "Pay": "Betaal",
        "Ignore": "Negeren",
        "Cancel": "Annuleren",
        "Total cost:": "Totale kosten:",
        "Total received:": "Totaal ontvangen:",
        // {0} = name of bill.
        "Close the {0} bill?": "Sluit de factuur {0}?",
        // {0} = name of bill.
        "Ignore {0} for this cycle?": "{0} negeren voor deze cyclus?",
        "Language:": "Taal:",
        "Planned Income": "Verwachte betaaling",
        "Unexpected Bill": "Onverwachte kost",
        "Schedule Bill": "Plan nieuwe betaling",
        "Schedule Income": "Plan nieuwe inkomsten",
        "Currency:": "Valuta:",
        "Switch to local currency {0}?": "Overschakelen naar lokale valuta {0}?"
    },
}