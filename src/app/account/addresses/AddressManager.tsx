"use client";

import { useActionState } from "react";
import {
  deleteAddressAction,
  saveAddressAction,
  type AccountFormState,
} from "@/app/account/actions";
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
  phone: string | null;
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [state, action, pending] = useActionState(saveAddressAction, {} as AccountFormState);

  return (
    <>
      {addresses.map((address) => (
        <section key={address.id} className={styles.panel}>
          <p>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.province} {address.postalCode}
          </p>
          <form action={deleteAddressAction}>
            <input type="hidden" name="id" value={address.id} />
            <button type="submit" className={styles.secondary}>
              Remove
            </button>
          </form>
        </section>
      ))}

      <form action={action} className={styles.panel}>
        <h2>Save a delivery address</h2>
        <p>Past orders keep the address used at checkout.</p>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="firstName">First name</label>
            <input id="firstName" name="firstName" />
          </div>
          <div className={styles.field}>
            <label htmlFor="lastName">Last name</label>
            <input id="lastName" name="lastName" />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="line1">Street address</label>
          <input id="line1" name="line1" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="line2">Suburb / extra line</label>
          <input id="line2" name="line2" />
        </div>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label htmlFor="city">City</label>
            <input id="city" name="city" required />
          </div>
          <div className={styles.field}>
            <label htmlFor="province">Province</label>
            <input id="province" name="province" required />
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="postalCode">Postal code</label>
          <input id="postalCode" name="postalCode" required />
        </div>
        {state.message ? <p className={styles.success}>{state.message}</p> : null}
        {state.error ? <p className={styles.error}>{state.error}</p> : null}
        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save address"}
        </button>
      </form>
    </>
  );
}
