"use client";

import { useActionState, useState } from "react";
import {
  deleteAddressAction,
  saveAddressAction,
  type AccountFormState,
} from "@/app/account/actions";
import { SOUTH_AFRICAN_PROVINCES } from "@/lib/checkout/provinces";
import styles from "../account.module.css";

type Address = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string | null;
};

function firstError(state: AccountFormState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function recipientName(address: Address) {
  return [address.firstName, address.lastName].filter(Boolean).join(" ").trim();
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [state, action, pending] = useActionState(
    saveAddressAction,
    {} as AccountFormState,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const editing = addresses.find((address) => address.id === editingId);

  return (
    <>
      {addresses.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No saved addresses</h2>
          <p className={styles.emptyCopy}>
            Add a South African delivery address below to reuse at checkout.
            Changing a saved address never rewrites a past order snapshot.
          </p>
        </div>
      ) : (
        addresses.map((address) => (
          <section key={address.id} className={styles.addressCard}>
            <h2>{recipientName(address) || "Saved address"}</h2>
            {address.phone ? <p>{address.phone}</p> : null}
            <p>
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.city}
              <br />
              {address.province}
              <br />
              {address.postalCode}
              <br />
              {address.country || "South Africa"}
            </p>
            <div className={styles.addressActions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setEditingId(address.id);
                  setConfirmId(null);
                }}
              >
                Edit
              </button>
              {confirmId === address.id ? (
                <form action={deleteAddressAction} className={styles.confirmRow}>
                  <input type="hidden" name="id" value={address.id} />
                  <p>Remove this address?</p>
                  <button type="submit" className={styles.submit}>
                    Confirm remove
                  </button>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => setConfirmId(null)}
                  >
                    Keep address
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setConfirmId(address.id)}
                >
                  Remove
                </button>
              )}
            </div>
          </section>
        ))
      )}

      <section className={styles.panel}>
        <h2>{editing ? "Edit address" : "Add a new address"}</h2>
        <form
          key={editingId ?? "new"}
          action={action}
          className={styles.formPanel}
        >
          {editingId ? <input type="hidden" name="id" value={editingId} /> : null}
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="address-firstName">First name</label>
              <input
                id="address-firstName"
                name="firstName"
                defaultValue={editing?.firstName ?? ""}
                autoComplete="given-name"
                required
              />
              {firstError(state, "firstName") ? (
                <p className={styles.error}>{firstError(state, "firstName")}</p>
              ) : null}
            </div>
            <div className={styles.field}>
              <label htmlFor="address-lastName">Last name</label>
              <input
                id="address-lastName"
                name="lastName"
                defaultValue={editing?.lastName ?? ""}
                autoComplete="family-name"
                required
              />
              {firstError(state, "lastName") ? (
                <p className={styles.error}>{firstError(state, "lastName")}</p>
              ) : null}
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="address-phone">Phone</label>
            <input
              id="address-phone"
              name="phone"
              type="tel"
              defaultValue={editing?.phone ?? ""}
              autoComplete="tel"
            />
            {firstError(state, "phone") ? (
              <p className={styles.error}>{firstError(state, "phone")}</p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="address-line1">Street address</label>
            <input
              id="address-line1"
              name="line1"
              defaultValue={editing?.line1 ?? ""}
              autoComplete="address-line1"
              required
            />
            {firstError(state, "line1") ? (
              <p className={styles.error}>{firstError(state, "line1")}</p>
            ) : null}
          </div>
          <div className={styles.field}>
            <label htmlFor="address-line2">Suburb / extra line</label>
            <input
              id="address-line2"
              name="line2"
              defaultValue={editing?.line2 ?? ""}
              autoComplete="address-line2"
            />
            <p className={styles.formHelp}>
              Optional. There is no separate suburb field, so use this line for
              suburb or extra delivery detail.
            </p>
            {firstError(state, "line2") ? (
              <p className={styles.error}>{firstError(state, "line2")}</p>
            ) : null}
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="address-city">City</label>
              <input
                id="address-city"
                name="city"
                defaultValue={editing?.city ?? ""}
                autoComplete="address-level2"
                required
              />
              {firstError(state, "city") ? (
                <p className={styles.error}>{firstError(state, "city")}</p>
              ) : null}
            </div>
            <div className={styles.field}>
              <label htmlFor="address-province">Province</label>
              <select
                id="address-province"
                name="province"
                defaultValue={editing?.province ?? ""}
                autoComplete="address-level1"
                required
              >
                <option value="">Select a province</option>
                {SOUTH_AFRICAN_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              {firstError(state, "province") ? (
                <p className={styles.error}>{firstError(state, "province")}</p>
              ) : null}
            </div>
          </div>
          <div className={styles.grid2}>
            <div className={styles.field}>
              <label htmlFor="address-postalCode">Postal code</label>
              <input
                id="address-postalCode"
                name="postalCode"
                defaultValue={editing?.postalCode ?? ""}
                autoComplete="postal-code"
                inputMode="numeric"
                required
              />
              {firstError(state, "postalCode") ? (
                <p className={styles.error}>{firstError(state, "postalCode")}</p>
              ) : null}
            </div>
            <div className={styles.field}>
              <label htmlFor="address-country">Country</label>
              <input
                id="address-country"
                name="country"
                value="South Africa"
                readOnly
                autoComplete="country-name"
              />
            </div>
          </div>
          <div className={styles.formStatus} aria-live="polite">
            {state.message ? <p className={styles.success}>{state.message}</p> : null}
            {state.error ? <p className={styles.error}>{state.error}</p> : null}
          </div>
          <div className={styles.formActions}>
            <button className={styles.submit} type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save address" : "Add address"}
            </button>
            {editing ? (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setEditingId(null)}
              >
                Cancel editing
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </>
  );
}
