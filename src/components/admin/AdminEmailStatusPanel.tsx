import {
  describeEmailAuditAction,
  readEmailOutcome,
} from "@/lib/admin/email-status";
import styles from "@/app/admin/(dashboard)/admin-pages.module.css";

type EmailHistoryEntry = {
  id: string;
  action: string;
  createdAt: Date;
  afterState: unknown;
  actor: { name: string | null; email: string | null } | null;
};

export function AdminEmailStatusPanel({
  configured,
  fromAddress,
  history,
}: {
  configured: boolean;
  fromAddress: string | null;
  history: EmailHistoryEntry[];
}) {
  return (
    <section className={styles.panel}>
      <h2>Customer email</h2>
      {configured ? (
        <p style={{ marginTop: 0 }}>
          Resend is configured. From: <strong>{fromAddress}</strong>
        </p>
      ) : (
        <p style={{ color: "#a15c00", marginTop: 0 }}>
          Resend is not configured. Set <code>RESEND_API_KEY</code> and{" "}
          <code>RESEND_FROM_EMAIL</code> before sending customer emails. Send
          buttons are disabled until then.
        </p>
      )}

      {history.length === 0 ? (
        <p className={styles.empty}>No email sends recorded for this record yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Action</th>
              <th scope="col">Actor</th>
              <th scope="col">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id}>
                <td>
                  {new Intl.DateTimeFormat("en-ZA", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(entry.createdAt)}
                </td>
                <td>{describeEmailAuditAction(entry.action)}</td>
                <td>
                  {entry.actor?.name ?? entry.actor?.email ?? "System"}
                </td>
                <td>{readEmailOutcome(entry.afterState) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
