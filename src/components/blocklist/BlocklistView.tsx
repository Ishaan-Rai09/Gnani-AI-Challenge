"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  CalendarDays,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CallerAvatar } from "@/components/app/CallerAvatar";
import { useCallShield } from "@/lib/store";
import { formatDateTime } from "@/lib/format";
import type { BlockedNumber } from "@/lib/types";

export function BlocklistView() {
  const { blocklist, addBlockedNumber, removeBlockedNumber } = useCallShield();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<BlockedNumber | null>(null);
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return blocklist;
    return blocklist.filter((item) =>
      [item.number, item.label, item.reason].join(" ").toLowerCase().includes(needle)
    );
  }, [blocklist, query]);

  const thisMonth = blocklist.filter((item) => {
    const date = new Date(item.blockedAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (number.replace(/[^\d]/g, "").length < 6) {
      setError("Enter a phone number with at least 6 digits.");
      return;
    }
    const added = addBlockedNumber({ number, label, reason });
    if (added) {
      setNumber("");
      setLabel("");
      setReason("");
      setError("");
      setAddOpen(false);
    } else {
      setError("That number is already on your blocklist.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-muted">
            Control · local blocklist
          </p>
          <h2 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.04em] sm:text-[32px]">
            Numbers you&apos;ve turned away.
          </h2>
          <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-muted">
            Numbers added from live screening, call history, or manually. Every block is reversible
            and keeps a record of why it was added.
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add number
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Blocked numbers
          </p>
          <p className="mt-2 font-display text-[28px] leading-none tabular-nums">{blocklist.length}</p>
          <p className="mt-1.5 text-[10px] text-muted">Stored on this device only</p>
        </div>
        <div className="rounded-xl border border-line bg-paper p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
            Added this month
          </p>
          <p className="mt-2 font-display text-[28px] leading-none tabular-nums">{thisMonth}</p>
          <p className="mt-1.5 text-[10px] text-muted">From screening and manual entries</p>
        </div>
        <div className="rounded-xl border border-signal/30 bg-signal/[0.06] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            Safety note
          </p>
          <p className="mt-2 flex items-start gap-2 text-[10.5px] leading-relaxed text-ink/60">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal" />
            Blocking hides the caller in this demo. It does not notify them or affect a real phone
            line.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-paper">
        <div className="flex flex-col gap-3 border-b border-line p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search blocked numbers…"
              aria-label="Search blocked numbers"
              className="input-base h-9 py-0 pl-9 pr-9 text-[12px]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear blocklist search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:text-ink"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted">
            {filtered.length} of {blocklist.length} shown
          </p>
        </div>

        {blocklist.length === 0 ? (
          <EmptyState
            icon={<Ban className="h-5 w-5" />}
            title="No blocked numbers"
            description="Numbers you block during screening or from call history will appear here. You can also add one manually."
            action={<Button onClick={() => setAddOpen(true)}>Add a number</Button>}
            className="m-4 border-0 bg-transparent"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="No numbers match"
            description="Try searching by number, label, or the reason recorded for the block."
            action={
              <Button variant="outline" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
            className="m-4 border-0 bg-transparent"
          />
        ) : (
          <div className="divide-y divide-line/70">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-ash/30 sm:flex-row sm:items-start"
              >
                <div className="flex flex-1 items-start gap-3">
                  <CallerAvatar name={item.label} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-[13px] font-medium tabular-nums text-ink">
                        {item.number}
                      </p>
                      <span className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.08em] text-muted">
                        {item.source === "call" ? "From screening" : "Manual"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-ink/60">{item.label}</p>
                    <p className="mt-1 max-w-[520px] text-[10.5px] leading-relaxed text-muted">
                      {item.reason}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted">
                      <CalendarDays className="h-2.5 w-2.5" />
                      Blocked {formatDateTime(item.blockedAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRemoval(item)}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-line bg-white px-2.5 py-1.5 text-[10px] font-medium text-ink/50 transition-colors hover:border-ink/30 hover:text-ink"
                >
                  <Trash2 className="h-3 w-3" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-line/70 bg-white/40 px-4 py-2.5">
          <p className="text-[9px] leading-relaxed text-muted">
            Prototype behaviour: blocklist entries are stored in local storage and can be removed
            at any time. Nothing is reported to a carrier.
          </p>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setError("");
        }}
        title="Add a number to your blocklist"
        description="Use a fictional or personal demo number. Nothing is dialled or reported."
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="add-number-form">
              <Ban className="h-3.5 w-3.5" />
              Block number
            </Button>
          </div>
        }
      >
        <form id="add-number-form" onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="block-number" className="mb-1.5 block text-[11px] font-medium text-ink/70">
              Phone number
            </label>
            <input
              id="block-number"
              value={number}
              onChange={(event) => {
                setNumber(event.target.value);
                setError("");
              }}
              placeholder="+91 90000 00000"
              data-autofocus
              className="input-base"
              inputMode="tel"
            />
          </div>
          <div>
            <label htmlFor="block-label" className="mb-1.5 block text-[11px] font-medium text-ink/70">
              Label <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="block-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="e.g. Claimed bank fraud desk"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="block-reason" className="mb-1.5 block text-[11px] font-medium text-ink/70">
              Reason <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="block-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Why are you blocking this number?"
              className="input-base resize-none"
            />
          </div>
          {error && (
            <p role="alert" className="text-[10.5px] font-medium text-signal">
              {error}
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) removeBlockedNumber(pendingRemoval.id);
        }}
        title="Remove this number?"
        description={
          pendingRemoval
            ? `${pendingRemoval.number} will no longer be blocked in this demo. Their call history stays untouched.`
            : ""
        }
        confirmLabel="Remove number"
        cancelLabel="Keep blocked"
        icon={<Ban className="h-5 w-5 text-signal" />}
      />
    </div>
  );
}
