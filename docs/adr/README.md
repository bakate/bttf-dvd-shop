# Architecture Decision Records

Short records of the decisions that shape this project: context, decision,
consequences. A superseded record stays in place and links to its
replacement.

| #    | Decision                                                                                             |
| :--- | :--------------------------------------------------------------------------------------------------- |
| 0001 | [Bootstrap from the author's template, on Node 26 LTS](0001-template-and-stack.md)                   |
| 0002 | [One required quality gate on every pull request](0002-ci-quality-gate.md)                           |
| 0003 | [Theme tokens and messages, checked by one script](0003-ui-conventions.md)                           |
| 0004 | [Light mode only](0004-light-mode-only.md)                                                           |
| 0005 | [One typed messages module, no i18n library](0005-no-i18n-library.md)                                |
| 0006 | [The API owns every pricing rule](0006-server-side-pricing.md)                                       |
| 0007 | [Amounts are integer euro cents, in one currency](0007-integer-cents-single-currency.md)             |
| 0008 | [How a basket is read and which titles are saga episodes](0008-input-reading-and-saga-membership.md) |
| 0009 | [Discount tiers are data](0009-discount-tiers-as-data.md)                                            |
| 0010 | [The price breakdown, in the API and on screen](0010-price-breakdown.md)                             |
| 0011 | [Tabler icons, decorative only](0011-tabler-icons.md)                                                |
| 0012 | [Invalid carts are RFC 9457 problem details](0012-invalid-carts-as-problem-details.md)               |
| 0013 | [Crash-only process handling](0013-crash-only-process-handling.md)                                   |
| 0014 | [The screen's safety net for unexpected failures](0014-frontend-error-safety-net.md)                 |
| 0015 | [One container serves the API and the frontend](0015-single-container-deployment.md)                 |
