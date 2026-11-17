/* ---------------------------------------------------------------------------
   Setup checklist — shared by floor.html (where it is ticked off) and
   display.html (which only shows how far along it is).

   Both pages build the list from this one file so the counts can never
   disagree. Nothing here touches Firestore; it turns a booking into a list of
   lines, and a saved state map into a score.

   A line's key has to stay the same when someone edits the booking, or a tick
   would jump to the wrong row. Keys are built from the station id and the
   supply name, not from the position in the list.
--------------------------------------------------------------------------- */

// Firestore map keys are happiest as plain characters.
const key = s => String(s).replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 90);

export const slug = s => String(s || "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

// "IV start kit, tourniquet; gloves" -> three lines.
const splitSupplies = s => String(s || "")
  .split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);

function stockHint(name, qty, o) {
  const inv = (o.inventory || []).find(i =>
    (i.name || "").toLowerCase() === String(name || "").toLowerCase());
  if (!inv) return { text: "", level: "none" };
  const have = inv.qty || 0;
  const where = inv.room && o.roomLabel ? ", in " + o.roomLabel(inv.room) : "";
  if (have < qty) return { text: have + " on hand" + where, level: "short" };
  if (inv.par && have <= inv.par)
    return { text: have + " on hand" + where + " — running low", level: "low" };
  return { text: have + " on hand" + where, level: "ok" };
}

/* Build the list for one booking.
   opts: { skills, inventory, roomLabel(id) }
   Returns groups: [{ id, title, sub, note, lines:[{key,text,qty,hint,level}] }] */
export function buildList(b, opts) {
  const o = opts || {};
  const groups = [];
  if (!b) return groups;

  const skillByName = n => (o.skills || []).find(k =>
    (k.name || "").toLowerCase() === String(n || "").toLowerCase());

  // One group per bed or table that has something happening at it.
  (b.stations || []).forEach(st => {
    if (!st.skill && !st.supplies) return;
    const k = skillByName(st.skill);
    const lines = [];
    // Steps written against the skill in Settings come first; without them,
    // a single line standing for the station itself.
    const steps = (k && (k.steps || [])) || [];
    if (steps.length) {
      steps.forEach((t, n) => lines.push({
        key: key("p_" + st.id + "_" + n + "_" + slug(t)), text: t, qty: 1,
        hint: n === 0 && k.mins ? "about " + k.mins + " min in all" : "",
        level: "none", step: true }));
    } else {
      lines.push({
        key: key("s_" + st.id),
        text: "Set up " + (st.label || "this station") +
              (st.skill ? " for " + st.skill : ""),
        qty: 1, hint: k && k.mins ? "about " + k.mins + " min" : "",
        level: "none", step: true });
    }
    // Supplies come from the skill library when the skill is in it, and from
    // whatever was typed on the booking when it is not.
    const items = (k && (k.items || []).length)
      ? k.items.map(i => ({ name: i.name, qty: i.qty || 1 }))
      : splitSupplies(st.supplies).map(n => ({ name: n, qty: 1 }));
    items.forEach(i => {
      const h = stockHint(i.name, i.qty, o);
      lines.push({ key: key("i_" + st.id + "_" + slug(i.name)), text: i.name,
                   qty: i.qty, hint: h.text, level: h.level });
    });
    groups.push({ id: "st_" + st.id, title: st.label || "Station",
                  sub: st.skill || "", note: (k && k.note) || "", lines });
  });

  // Equipment booked for the session — manikins, pumps, carts.
  if ((b.items || []).length) {
    const lines = b.items.map(x => {
      const inv = (o.inventory || []).find(i => i.id === x.id) || {};
      const name = inv.name || x.name || x.id;
      const home = inv.room && o.roomLabel ? "kept in " + o.roomLabel(inv.room) : "";
      return { key: key("e_" + (x.id || slug(name))), text: name, qty: x.qty || 1,
               hint: [home, x.station ? "at " + x.station : ""]
                       .filter(Boolean).join(" · "), level: "none" };
    });
    groups.push({ id: "equip", title: "Equipment to bring", sub: "", note: "", lines });
  }

  // Whatever the instructor typed in the Setup box.
  if (b.setup) {
    groups.push({ id: "fromsched", title: "From the schedule", sub: "", note: "",
      lines: [{ key: "n_setup", text: b.setup, qty: 1, hint: "", level: "none" }] });
  }

  // Lines someone added while setting the room up.
  const extra = (b.__extra || []).map(x => ({
    key: key(x.key), text: x.text, qty: 1, hint: x.by ? "added by " + x.by : "",
    level: "none", added: true }));
  if (extra.length)
    groups.push({ id: "added", title: "Added here", sub: "", note: "", lines: extra });

  return groups;
}

/* How far along the list is. state maps key -> "done" | "missing". */
export function score(groups, state) {
  const s = state || {};
  let total = 0, done = 0, missing = 0;
  groups.forEach(g => g.lines.forEach(l => {
    total++;
    if (s[l.key] === "done") done++;
    else if (s[l.key] === "missing") missing++;
  }));
  return { total, done, missing, pending: total - done - missing,
           ready: total > 0 && done === total };
}

/* A short badge for the week board: "", "4/9", "Ready", "2 missing". */
export function badge(sc) {
  if (!sc.total) return "";
  if (sc.missing) return sc.missing + " missing";
  if (sc.ready) return "Ready";
  return sc.done + "/" + sc.total;
}
