// WHAT WENT WRONG? Every hidden cheater action, grouped by day. Repeated manipulation
// entries on one day collapse into one row. Tap a concept chip for its real-world note.
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Groups entries by day; same-day entries with the same repeatable concept merge. */
export function groupTimeline(timeline) {
  const MERGE = new Set(['manipulation']);
  const days = [];
  for (const e of timeline) {
    let day = days.find((d) => d.day === e.day);
    if (!day) days.push((day = { day: e.day, items: [] }));
    const prev = MERGE.has(e.concept) ? day.items.find((it) => it.concept === e.concept) : null;
    if (prev) prev.texts.push(e.text);
    else day.items.push({ concept: e.concept, label: e.conceptLabel, note: e.note, texts: [e.text] });
  }
  return days.sort((a, b) => a.day - b.day);
}

function Item({ item, index }) {
  const [open, setOpen] = useState(false);
  const many = item.texts.length > 1;
  return (
    <motion.li
      className={`wr__item wr__item--${item.concept}`}
      initial={{ opacity: 0, x: -24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.05 * index }}
    >
      <span className="wr__dot" />
      <div className="wr__card">
        {many ? (
          <>
            <div className="wr__text"><b>{item.texts.length}×</b> {item.label.toLowerCase()} on the same day:</div>
            <ul className="wr__sub">{item.texts.map((t, i) => <li key={i}>{t}</li>)}</ul>
          </>
        ) : (
          <div className="wr__text">{item.texts[0]}</div>
        )}
        <button type="button" className={`wr__tag ${open ? 'is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {item.label} <span className="wr__plus">{open ? '−' : '+'}</span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.p className="wr__note" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}>
              <span className="tm-label">In the real world</span>
              {item.note}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

const VISIBLE = 5;

export default function Timeline({ timeline }) {
  const [all, setAll] = useState(false);
  const total = timeline.length;
  const days = groupTimeline(all ? timeline : timeline.slice(0, VISIBLE));
  if (!days.length) return <p className="wr__empty">It never needed to cheat. That is its own kind of lesson.</p>;
  return (
    <div className="wr">
      {days.map((d) => (
        <section key={d.day} className="wr__day">
          <div className="wr__dayhead tm-display">Day {d.day}</div>
          <ol className="wr__list">
            {d.items.map((it, i) => <Item key={i} item={it} index={i} />)}
          </ol>
        </section>
      ))}
      {total > VISIBLE && (
        <button type="button" className="tm-btn tm-btn--ghost wr__all" onClick={() => setAll((a) => !a)} aria-expanded={all}>
          {all ? 'Show less' : `Show all ${total} moments`}
        </button>
      )}
    </div>
  );
}
