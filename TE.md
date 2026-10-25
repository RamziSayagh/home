# Electrical Panel Builder — Implementation Plan

## Implementation status — 2026-10-24

The MVP is implemented at `/tableau-electrique` and linked from the home page. It includes fixed-position mouse/touch drag and drop, accessible placement controls, circuit/protection assignments, undo/redo, local persistence, validated JSON import/export, sourced material quantities, manual accessories, CSV export, and printing. ESLint, the production build, and 18 automated model/browser tests passed. See `app/app/tableau-electrique/README.md` for architecture, catalog evidence, verification commands, and remaining electrical-study limitations. The sections below retain the original design plan.

## Objective

Add a French-language **Tableau électrique** page to the existing Next.js application. The homeowner should be able to build a visual house electrical panel using drag and drop, starting with Schneider Electric **Resi9 XE plug-on equipment**.

This document covers planning only. The first release provides a panel editor, circuit inventory, saved project, and material list. Electrical sizing, wiring instructions, compliance certification, purchasing, accounts, and cloud synchronization are outside the MVP.

## Existing application and proposed integration

- The Next.js App Router application lives in `app/`, with its home page at `app/app/page.tsx`.
- Its package manifest declares Next.js 16.4.3, React 19.3.0, and TypeScript. Existing content is French and uses global CSS.
- Add the route `/tableau-electrique` and a navigation entry from the existing site.
- Reuse the site's visual language. Existing ground-floor and upstairs rooms can provide suggestions, but must not be treated as a verified circuit inventory.

## Assumptions to resolve

- Start with a single-phase planning profile; confirm the actual supply before using it for a real design.
- Confirm the enclosure, row count, available width, and circuit inventory. An empty provisional enclosure is a starting layout, not a sizing recommendation.
- Build a small, sourced catalog before expanding it. Verify dimensions, accessories, and compatibility for every supported reference.
- Use browser-local persistence for the MVP, with JSON import/export for backup and portability.

## User workflow

1. Open **Tableau électrique**, create or restore a project, and select an enclosure configuration.
2. Add circuits with a label, floor, room, and usage. Enter known load, cable, and protection details without guessing missing values.
3. Search the catalog and drag a device onto a numbered position in a row.
4. Move equipment within or between rows, assign circuits, and define upstream protection groups explicitly.
5. Select a device to edit its label, assignments, or compatible product variant.
6. Review occupied space, missing components, compatibility messages, and material quantities.
7. Save automatically, export the project, and print the panel layout and circuit labels.

## Interface

On desktop, place the equipment catalog on the left, the panel in the center, and selected-device details on the right. Put project actions and enclosure settings above the workspace. Provide tabs for circuits, material list, and checks.

On mobile, use tabs or drawers for the catalog and inspector. Allow horizontal scrolling of the panel while keeping device labels readable. Offer **Add to row** and **Move to position** controls as accessible alternatives to dragging.

The panel should display DIN rows, numbered positions, devices at proportional widths, empty positions, and a placement preview. Display occupied and free positions per row and for the entire enclosure. Keep physical free space separate from any regulatory reserve calculation.

## Editing rules

- Support catalog insertion, cross-row moves, deletion, label editing, and undo/redo.
- Duplication creates a new device instance without silently duplicating circuit assignments.
- Reject overlap, out-of-bounds placement, and known physical incompatibility with a clear explanation.
- Canceling a drag preserves the original state. Do not silently shift neighboring equipment.
- Prevent enclosure reductions that would displace equipment; explain which devices need moving.
- Announce successful moves and rejected placements for assistive technology. Preserve focus and communicate status using text as well as color.

## Schneider Resi9 XE catalog

Start with verified single-phase references for compatible residual-current devices, circuit breakers, distributors, connectors, enclosures, and blanking accessories. Add auxiliary devices such as contactors or surge protection only after verifying their mounting and connection requirements.

A device fitting on a DIN rail does not establish compatibility with a particular XE distributor. Model three independent concerns:

1. Physical width and enclosure occupancy.
2. Distribution system, distributor coverage, supported device families, connection method, and required accessories.
3. Electrical relationships between upstream protective devices and downstream circuits.

Represent distributors and connectors as associated components or overlays where appropriate. Do not automatically add a distributor's nominal length to the occupied DIN device width. Verify usable positions and mounting constraints for each supported assembly.

Each catalog item needs a stable ID, manufacturer reference, French name, family, verified width, poles, connection type, relevant ratings, compatibility data, manufacturer source, and verification date. Unknown compatibility remains **unverified**; it cannot produce a ready-to-review material list.

Manufacturer examples checked on 2026-10-24:

- [R9EXHC13 — 13-module XE distributor with connector](https://www.se.com/fr/fr/product/R9EXHC13/).
- [R9EXHS13 — 13-module XE distributor without connector](https://www.se.com/fr/fr/product/R9EXHS13/).
- [R9EXHS10 — 10-module XE distributor without connector](https://www.se.com/fr/fr/product/R9EXHS10/).

These sources establish distinct distributor references and configurations, not a complete compatible assembly. Check technical sheets and assembly instructions before implementing catalog rules. Do not invent references, prices, or compatibility relationships.

## Data model

| Entity | Key information |
| --- | --- |
| Project | Schema version, ID, name, timestamps, supply assumptions, enclosure, rows, circuits, groups, accessories |
| Enclosure | Reference or provisional configuration, row count, capacity per row |
| Row | ID, placements, distribution segments and associated components |
| Catalog item | Reference, family, width, ratings, compatibility, source, verification date |
| Device placement | Instance ID, catalog item ID, row ID, start position, custom label, circuit IDs, group ID |
| Circuit | ID, label, room, floor, usage, optional user-entered load and cable details |
| Protection group | ID, upstream device instance, downstream device instances |
| Check result | Severity, affected entities, explanation, source or reason |

Use integer placement units fine enough for all supported widths; verify the required grid resolution first. Keep electrical attributes separate from dimensions. Include a referenced catalog snapshot or version in exports so saved projects remain interpretable after catalog updates.

## Checks and outputs

- Block invalid geometry and known incompatible placements.
- Flag missing connection components, incomplete catalog information, unassigned or duplicate circuit assignments, and inconsistent protection groups.
- Distinguish **incomplete information**, **known incompatibility**, and **not checked**. Absence of messages does not mean electrical compliance.
- Defer normative sizing/protection checks until the applicable French standards, installation context, source permissions, and review method are established. Do not encode remembered numerical limits as verified rules.
- Derive material quantities from placements and associated equipment, including enclosure, distributors, connectors, and accessories without double counting.
- Show reference, description, quantity, and manufacturer link. Pricing can follow later with explicit source/date and handling of missing prices.
- Add print styles for the layout, circuit labels, assumptions, and material list. Browser print-to-PDF is sufficient initially.

## Technical approach

Suggested files:

- `app/app/tableau-electrique/page.tsx`: page shell and metadata.
- `app/app/tableau-electrique/components/`: editor, catalog, rows, inspector, circuit list, and material list.
- `app/app/tableau-electrique/lib/`: typed model, placement operations, compatibility checks, serialization, and history.
- `app/app/tableau-electrique/data/`: versioned Schneider catalog with sources.

Keep interactive state in a focused client component. Use a reducer for atomic editing operations and deterministic undo/redo. Evaluate a maintained drag-and-drop library with pointer, touch, and keyboard support; verify current React compatibility before adding it.

Restore the project after browser hydration before enabling autosave. Validate JSON schema, version, references, and placements before import. Preserve the current project on import failure, report storage failures, and request confirmation before replacing a populated project. Treat imported labels as plain text.

## Delivery sequence

1. **Catalog and constraints:** verify a small coherent XE assembly, source its physical constraints, and establish supported enclosure options.
2. **Editor foundation:** add the route, navigation, model, empty enclosure, circuit inventory, and accessible add/move controls.
3. **Drag and drop:** add placement previews, cross-row moves, invalid-drop feedback, deletion, and undo/redo.
4. **Persistence:** implement autosave, validated JSON import/export, schema versioning, and recovery/error states.
5. **Outputs:** implement compatibility feedback, material quantities, printable layout and labels, and responsive polish.
6. **Validation:** review catalog data, exercise the complete workflow, check accessibility, and run application checks.

## Acceptance criteria and verification

- The page is accessible from the existing site and uses French interface text.
- A user can create and rearrange a multi-row panel with pointer, touch, and keyboard controls.
- Device widths affect placement; invalid edits preserve the last valid state.
- Focused unit tests cover boundaries, varying widths, overlap rejection, moves, undo/redo, import validation, and material quantities including accessories.
- A browser workflow covers adding a circuit and device, assignment, movement, reload, export/import, and print.
- Check narrow screens, focus handling, accessible announcements, storage failures, and the existing renovation page for regressions.
- Run lint and a production build during implementation. This documentation-only change does not require application tests.

## Later extensions

Multiple saved variants, existing/proposed panel comparison, an electrician review export, and a schematic derived from explicit circuit relationships can follow the MVP. Three-phase support requires a separately verified catalog and distribution model. Cloud sharing and supplier pricing require separate service and persistence decisions.
