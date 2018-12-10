# Account Manager
A purely client-side finance manager built on a framework-less JavaScript core using local storage.

## Features:
* Entirely client side.
  * All data stored in localStorage.
  * Automatically synchronised across browser tabs/windows.
  * Automatically saved on changes.
  * Zero network traffic after downloading codebase.
* Payments and income with recurrence patterns
  * Once
  * Monthly
  * Bi-monthly
  * Quarterly
  * Bi-annually
  * Annually
* Group payments by an entity (such as a person or category).
  * Filter current month by grouping.
* Save and restore of backups
  * Password protected.
  * Encrypted with AES-GCM using 256 bit key length.
  * All done on the client side using Javascript `crypto.subtle` package.

## To-do:
* More reporting and analysis.
* Other backup methods / cross-device synchronization.
  * Encrypt to cloud storage.
  * Restore from cloud storage.

## Third-Party libraries:
* [ChartJS](https://www.chartjs.org/) (MIT License)

You can try out the code here: https://kwilliams1987.github.io/account-manager/
