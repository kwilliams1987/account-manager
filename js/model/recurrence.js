"use strict";

export default class Recurrence {
    static get never() { return 0; }
    static get monthly() { return 1; }
    static get bimonthly() { return 2; }
    static get quarterly() { return 3; }
    static get biannually() { return 4; }
    static get annually() { return 5; }
}