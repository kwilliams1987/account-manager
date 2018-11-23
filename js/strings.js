"use strict";

const internal = Symbol("internal");

class ITranslate {
    /**
     * Attempt to translate the provided text into the users language.
     *
     * @param {String} string
     * @param {...String} placeholders
     */
    translate(string, ...placeholders) {
        placeholders.forEach(p => string = string.replace(new RegExp('\\{' + p + '\\}', 'gi'), placeholders[p]));
        return string;
    }

    /**
     * Format the provided number based on the current Storage set locale and currency.
     *
     * @param {Number} amount
     */
    formatCurrency(amount) {
        throw new Error("Not implemented.");
    }
}

class Strings {
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
            return "$" + string;
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
        "Switch to local currency {0}?": "Switch to local currency {0}?",
        "Create Backup": "Create Backup",
        "Restore Backup": "Restore Backup",
        "Please provide a password:": "Please provide a password:",
        "Your browser doesn't support encryption": "Your browser doesn't support encryption",
        "Export failed: {0}.": "Backup failed: {0}.",
        "Import failed: {0}.": "Restore failed: {0}.",
        "Restoring a backup will overwrite your existing data, continue?": "Restoring a backup will overwrite your existing data, continue?",
        "Backup password:": "Backup password:",
        "Invalid backup password": "Invalid backup password",
        "Invalid backup selected": "Invalid backup selected",
        "Close": "Close",
        "Yes": "Yes",
        "No": "No",
        "Okay": "Okay",
        "Cost": "Cost",
        "Start Date": "Start Date",
        "End Date": "End Date",
        "Recurrence": "Recurrence",
        "Never": "Never",
        "Monthly": "Monthly",
        "Bi-Monthly": "Bi-Monthly",
        "Quarterly": "Quarterly",
        "Bi-Annually": "Bi-Annually",
        "Annually": "Annually",
        "Save": "Save"
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
        "Switch to local currency {0}?": "Switch to local currency {0}?",
        "Create Backup": "Create Backup",
        "Restore Backup": "Restore Backup",
        "Please provide a password:": "Please provide a password:",
        "Your browser doesn't support encryption": "Your browser doesn't support encryption",
        "Export failed: {0}.": "Backup failed: {0}.",
        "Import failed: {0}.": "Restore failed: {0}.",
        "Restoring a backup will overwrite your existing data, continue?": "Restoring a backup will overwrite your existing data, continue?",
        "Backup password:": "Backup password:",
        "Invalid backup password": "Invalid backup password",
        "Invalid backup selected": "Invalid backup selected",
        "Close": "Close",
        "Yes": "Yes",
        "No": "No",
        "Okay": "Okay",
        "Cost": "Cost",
        "Start Date": "Start Date",
        "End Date": "End Date",
        "Recurrence": "Recurrence",
        "Never": "Never",
        "Monthly": "Monthly",
        "Bi-Monthly": "Bi-Monthly",
        "Quarterly": "Quarterly",
        "Bi-Annually": "Bi-Annually",
        "Annually": "Annually",
        "Save": "Save"
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
        "Switch to local currency {0}?": "Overschakelen naar lokale valuta {0}?",
        "Create Backup": "Back-up maken",
        "Restore Backup": "Back-up terugzetten",
        "Please provide a password:": "Kies een wachtwoord:",
        "Your browser doesn't support encryption": "Uw browser ondersteund encryptie niet",
        "Export failed: {0}.": "Back-up mislukt: {0}.",
        "Import failed: {0}.": "Herstel mislukt: {0}.",
        "Restoring a backup will overwrite your existing data, continue?": "Als u een back-up herstelt, worden uw bestaande gegevens overschreven, gaat u verder?",
        "Backup password:": "Backup wachtwoord:",
        "Invalid backup password": "De back-up wachtwoord klopt niet",
        "Invalid backup selected": "Ongeldige back-up geselecteerd",
        "Close": "Sluiten",
        "Yes": "Ja",
        "No": "Nee",
        "Okay": "Okay",
        "Cost": "Kosten",
        "Start Date": "Vanaf",
        "End Date": "t/m",
        "Recurrence": "Herhaling",
        "Never": "Nooit",
        "Monthly": "Maandelijks",
        "Bi-Monthly": "Tweemaandelijks",
        "Quarterly": "Per kwartaal",
        "Bi-Annually": "Tweejaarlijks",
        "Annually": "Jaarlijks",
        "Save": "Opslaan"
    },
}

export { Strings, ITranslate };