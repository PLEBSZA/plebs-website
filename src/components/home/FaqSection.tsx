"use client";

import { useId, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./FaqSection.module.css";

const faqs = [
  {
    question: "Are the dungarees made from 100% cotton?",
    answer:
      "Yes. The main corduroy fabric is made from 100% cotton. Hardware, thread and trim materials will be listed separately in the final product specifications.",
  },
  {
    question: "Are the dungarees for women or men?",
    answer:
      "The intended fit and grading are still being confirmed. PLEBS will only describe the dungarees as unisex once the garment measurements and production grading support that claim.",
  },
  {
    question: "How should the dungarees fit?",
    answer:
      "Aim for a comfortable relaxed fit that leaves room to layer. Final fit notes and model references will be added once confirmed.",
  },
  {
    question: "How do I wash cotton corduroy?",
    answer:
      "Care guidance is still being finalised. Until the full care guide is confirmed, wash gently, avoid high heat, and follow the care label once attached.",
  },
  {
    question: "Will cotton corduroy shrink?",
    answer:
      "Cotton can relax or shrink depending on wash and dry method. Exact shrinkage expectations will be confirmed with finished production samples.",
  },
  {
    question: "How do I choose the correct size?",
    answer:
      "Use the size guide and compare your measurements to the garment chart once published. If you are between sizes, fit preference usually decides.",
  },
  {
    question: "Where does PLEBS deliver?",
    answer:
      "Delivery regions and timelines are still being confirmed. Shipping details will be published on the Shipping & Returns page.",
  },
  {
    question: "Can I exchange the dungarees for another size?",
    answer:
      "Exchange and return terms are still being finalised. The Refund Policy and Shipping & Returns pages will carry the confirmed process.",
  },
];

export function FaqSection() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className={`section section--sand ${styles.section}`}>
      <div className="container">
        <SectionHeading title="Questions About the PLEBS Dungarees" />
        <div className={styles.list}>
          {faqs.map((faq, index) => {
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            const isOpen = openIndex === index;

            return (
              <div key={faq.question} className={styles.item}>
                <h3 className={styles.question}>
                  <button
                    id={buttonId}
                    type="button"
                    className={styles.trigger}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    data-event="faq_interaction"
                    data-event-label={faq.question}
                    onClick={() =>
                      setOpenIndex((current) =>
                        current === index ? null : index,
                      )
                    }
                  >
                    <span>{faq.question}</span>
                    <span className={styles.icon} aria-hidden="true">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className={styles.panel}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
