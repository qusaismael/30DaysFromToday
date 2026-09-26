# Local baseline, before code changes

Captured from the original static page using `SITE_CAPTURE_TAG=before flock -w 1200 /opt/data/repos/.site-browser.lock npm test -- tests/audit.spec.cjs --workers=1` at 1440×900, 390×844, and 320×568, with one result state for each. All six JPEGs are full-page captures.

| Viewport | Initial page height | Result page height | Horizontal overflow | Small visible targets | Page errors | Reduced-motion result animation |
|---|---:|---:|---:|---:|---|---|
| 1440×900 | 1219px | 1699px | 0px | 0 | none | `slideIn` |
| 390×844 | 2077px | 2745px | 37px | 0 | none | `slideIn` |
| 320×568 | 2190px | 2965px | 107px | 0 | none | `slideIn` |

The custom-day input and Calculate button share a fixed horizontal flex row: on phones the Calculate button protrudes past the card/right viewport. Focus traversal began at the native date input; result output had no persistent live region. No image elements were present. Owner-authored visible copy and section order are unchanged in the implementation branch.
